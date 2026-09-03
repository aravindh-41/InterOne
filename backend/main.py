import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

import database
import models

# ENVIRONMENT SETUP
load_dotenv()

# PATH SETUP
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# DATABASE CREATION & AUTO-MIGRATION
models.Base.metadata.create_all(bind=database.engine)

def patch_database_schema():
    """Automatically patches all missing columns in remote MySQL database on startup."""
    with database.engine.connect() as conn:
        columns_to_add = [
            ("latitude", "FLOAT NULL"),
            ("longitude", "FLOAT NULL"),
            ("image_path", "VARCHAR(255) NULL"),
            ("created_at", "DATETIME NULL"),
            ("expires_at", "DATETIME NULL"),
        ]
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE listings ADD COLUMN {col_name} {col_type};"))
                conn.commit()
                print(f"Database migration: Added '{col_name}' column successfully.")
            except Exception:
                pass  # Column already exists

patch_database_schema()

# FASTAPI APP
app = FastAPI(title="InterOne API")

# CATCH-ALL EXCEPTION HANDLER (Prevents raw HTML Internal Server Errors)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Server Error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Backend Error: {str(exc)}"}
    )

# SERVE UPLOADED IMAGES
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GEMINI AI CLIENT
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# HELPER FUNCTION FOR GEMINI RETRIES & FALLBACK
def generate_ai_content(prompt: str, image_data: bytes = None, mime_type: str = None):
    if not client:
        return "AI Service Unavailable: GEMINI_API_KEY environment variable is missing on Render."
        
    models_to_try = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-1.5-flash"
    ]
    
    last_error = None
    
    for model_name in models_to_try:
        for attempt in range(2):  # Try each model twice with a short delay
            try:
                contents = [prompt]
                if image_data and mime_type:
                    contents.append({"inline_data": {"mime_type": mime_type, "data": image_data}})
                
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                last_error = e
                err_str = str(e).upper()
                if "503" in err_str or "UNAVAILABLE" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    time.sleep(1.2 * (attempt + 1))
                    continue
                raise e

    print(f"All Gemini models exhausted. Last error: {last_error}")
    return "The AI service is currently experiencing high server demand across all models. Please try again in a few moments."

# PYDANTIC SCHEMAS
class ChatRequest(BaseModel):
    message: str

class ZerowasteRequest(BaseModel):
    crop_name: str
    quantity_kg: float
    location: str
    condition: str

class MandiQueryRequest(BaseModel):
    crop_name: str
    location: str

class ListingRequest(BaseModel):
    farmer_name: str
    crop_name: str
    quantity_kg: float
    price_per_kg: float
    location: str
    latitude: float | None = None
    longitude: float | None = None
    contact: str
    image_path: str | None = None

# HEALTH CHECK ENDPOINT
@app.get("/api/health")
def health_check():
    return {"status": "Running", "message": "InterOne API is live"}

# HELPER: DATABASE EXPIRATION CLEANUP
def cleanup_expired_listings(db: Session):
    """Safely removes expired listings prior to query execution."""
    now = datetime.now(timezone.utc)
    try:
        db.query(models.DBListing).filter(
            models.DBListing.expires_at <= now
        ).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Cleanup non-fatal error: {e}")

# DATABASE MARKETPLACE ENDPOINTS
@app.get("/api/listings")
def get_listings(db: Session = Depends(database.get_db)):
    cleanup_expired_listings(db)
    now = datetime.now(timezone.utc)
    listings = (
        db.query(models.DBListing)
        .filter(models.DBListing.expires_at > now)
        .order_by(models.DBListing.id.desc())
        .all()
    )
    return listings

# CREATE MARKETPLACE LISTING
@app.post("/api/listings")
def create_listing(req: ListingRequest, db: Session = Depends(database.get_db)):
    created_time = datetime.now(timezone.utc)
    expiry_time = created_time + timedelta(days=3)
    new_listing = models.DBListing(
        farmer_name=req.farmer_name,
        crop_name=req.crop_name,
        quantity_kg=req.quantity_kg,
        price_per_kg=req.price_per_kg,
        location=req.location,
        latitude=req.latitude,
        longitude=req.longitude,
        contact=req.contact,
        image_path=req.image_path,
        created_at=created_time,
        expires_at=expiry_time,
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return {"status": "success", "listing": new_listing}

# PRODUCT IMAGE UPLOAD
@app.post("/api/upload-image")
async def upload_product_image(file: UploadFile = File(...)):
    MAX_SIZE = 2 * 1024 * 1024
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed.",
        )
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image must be 2 MB or smaller.",
        )
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
    filename = f"product_{timestamp_str}{extension}"
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as buffer:
        buffer.write(contents)
    return {
        "status": "success",
        "filename": filename,
        "image_path": f"/uploads/{filename}",
        "size_kb": round(len(contents) / 1024, 2),
    }

# AI PRODUCE QUALITY ANALYZER
@app.post("/api/ai/analyze-produce")
async def analyze_produce(crop_name: str = Form(...), file: UploadFile = File(...)):
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are allowed.",
        )
    image_data = await file.read()
    MAX_SIZE = 2 * 1024 * 1024
    if len(image_data) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image must be 2 MB or smaller.",
        )
    prompt = f"""You are InterOne AI, an agricultural produce quality assessment assistant for farmers in India.
Analyze the uploaded image of:
Crop / Produce: {crop_name}

IMPORTANT:
Only identify issues that are visually observable.
Do not claim laboratory-level certainty.
- If the image is unclear, say that the assessment is visual and uncertain.
Do not invent diseases or defects that cannot reasonably be observed.
- Give practical advice for the farmer.

Provide the result using exactly these sections:
**1. Produce Identification**
Identify whether the image appears consistent with the crop name provided.

**2. Visual Quality**
Give one rating: Excellent / Good / Fair / B-Grade / Poor

**3. Visible Condition**
Briefly describe the visible condition.

**4. Issues Detected**
List visible issues such as: bruising, discoloration, cuts, cracks, rot-like appearance, pest damage, mold-like appearance, dryness. Only mention issues that are actually visible.

**5. Freshness Assessment**
Give: Fresh / Moderately Fresh / Needs Quick Sale / Likely Perishing. This is only a visual estimate.

**6. Recommended Selling Channel**
Choose the most suitable option: Direct Marketplace / Quick Sale / Food Processing / Value Addition / Livestock / Feed / Organic / Compost / Energy Recovery. Explain briefly why.

**7. Farmer Recommendation**
Give 2-4 practical actions the farmer should take.
Keep the answer concise and farmer-friendly."""

    try:
        analysis_text = generate_ai_content(
            prompt=prompt,
            image_data=image_data,
            mime_type=file.content_type
        )
        return {"status": "success", "crop": crop_name, "analysis": analysis_text}
    except Exception as e:
        return {"status": "error", "crop": crop_name, "analysis": f"AI Analysis Error: {str(e)}"}

# AI CHAT
@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest):
    try:
        system_prompt = (
            "You are InterOne AI, an agricultural marketplace assistant in India. "
            "Help farmers sell crops directly, suggest pricing, and suggest zero-waste channels."
        )
        full_prompt = f"{system_prompt}\n\nUser Question: {req.message}"
        reply_text = generate_ai_content(prompt=full_prompt)
        return {"reply": reply_text}
    except Exception as e:
        return {"reply": f"AI Error: {str(e)}"}

# ZERO-WASTE AI
@app.post("/api/ai/zero-waste")
def zero_waste_analysis(req: ZerowasteRequest):
    try:
        prompt = (
            f"A farmer in {req.location} has {req.quantity_kg} kg of unsold/surplus "
            f"{req.crop_name} in '{req.condition}' condition.\n"
            "Provide a structured zero-waste strategy with 3 specific local secondary buyer channels in South India:\n"
            "1. **Food Processing / Value Addition** (e.g., pickle/jam makers, dehydration units)\n"
            "2. **Livestock & Feed** (e.g., cattle farms, poultry feed processors)\n"
            "3. **Organic / Energy Recovery** (e.g., vermicomposting, biogas units)\n"
            "Include estimated recovery pricing in INR/kg for each option."
        )
        strategy_text = generate_ai_content(prompt=prompt)
        return {"strategy": strategy_text}
    except Exception as e:
        return {"strategy": f"Zero-Waste Error: {str(e)}"}

# MANDI PRICE INTELLIGENCE
@app.post("/api/ai/mandi-price")
def get_mandi_price_intelligence(req: MandiQueryRequest):
    try:
        prompt = (
            "You are an expert agricultural economist in South India.\n"
            "Provide a concise Mandi Price Intelligence report for:\n"
            f"- Crop: {req.crop_name}\n"
            f"- Mandi/Region: {req.location}\n\n"
            "FORMATTING RULES:\n"
            "- Do NOT use markdown tables (no '|' grid lines).\n"
            "- Do NOT use giant '#' or '##' main titles.\n"
            "- Use simple bold section titles (e.g. **1. Estimated Market Benchmark**) and clean bullet points (*).\n\n"
            "Include:\n"
            "1. **Estimated Market Benchmark**: Per Kg & Quintal range (Minimum, Modal, Maximum).\n"
            "2. **Nearby Alternative Mandis**: Compare rates in 2 neighboring market hubs.\n"
            "3. **7-Day Price Trend**: State if prices are UP, DOWN, or STABLE and why.\n"
            "4. **Best Selling Advice**: Clear actionable recommendation for the farmer."
        )
        report_text = generate_ai_content(prompt=prompt)
        return {"report": report_text}
    except Exception as e:
        return {"report": f"Mandi Intel Error: {str(e)}"}

# REACT FRONTEND SERVING
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))