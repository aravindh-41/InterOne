from pathlib import Path
from datetime import datetime, timedelta, timezone

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from sqlalchemy.orm import Session

from google import genai

import os
from dotenv import load_dotenv

import database
import models


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()


# =========================================================
# PATH SETUP
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

# Product image upload folder
UPLOAD_DIR = BASE_DIR / "uploads"

# Create uploads folder automatically
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# DATABASE
# =========================================================

# Automatically create database tables
models.Base.metadata.create_all(
    bind=database.engine
)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="InterOne API"
)


# =========================================================
# SERVE UPLOADED IMAGES
# =========================================================

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# HTML FILE
# =========================================================

INDEX_HTML_PATH = (
    BASE_DIR /
    "templates" /
    "index.html"
)


# =========================================================
# GEMINI AI
# =========================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

if not GEMINI_API_KEY:
    print(
        "WARNING: GEMINI_API_KEY is not configured."
    )

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# PYDANTIC SCHEMAS
# =========================================================

class ChatRequest(BaseModel):
    message: str


class ZeroWasteRequest(BaseModel):
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

# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def read_root():
    return {
        "status": "Running",
        "message": "InterOne API is live"
    }


# =========================================================
# HELPER: DATABASE EXPIRATION CLEANUP
# =========================================================

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


# =========================================================
# DATABASE MARKETPLACE ENDPOINTS
# =========================================================

@app.get("/api/listings")
def get_listings(
    db: Session = Depends(
        database.get_db
    )
):
    # 1. Clean up expired records
    cleanup_expired_listings(db)

    # 2. Get current UTC time
    now = datetime.now(timezone.utc)

    # 3. Retrieve active listings
    listings = (
        db.query(
            models.DBListing
        )
        .filter(
            models.DBListing.expires_at > now
        )
        .order_by(
            models.DBListing.id.desc()
        )
        .all()
    )

    return listings


# =========================================================
# CREATE MARKETPLACE LISTING
# =========================================================

@app.post("/api/listings")
def create_listing(
    req: ListingRequest,
    db: Session = Depends(
        database.get_db
    )
):
    # Timezone-aware creation timestamp
    created_time = datetime.now(timezone.utc)

    # Expiry calculated for exactly 3 days
    expiry_time = (
        created_time +
        timedelta(days=3)
    )

    # Create database listing
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
        expires_at=expiry_time
    )

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    return {
        "status": "success",
        "listing": new_listing
    }


# =========================================================
# PRODUCT IMAGE UPLOAD
# =========================================================

@app.post("/api/upload-image")
async def upload_product_image(
    file: UploadFile = File(...)
):

    # Maximum image size = 2 MB
    MAX_SIZE = 2 * 1024 * 1024

    # -----------------------------------------------------
    # CHECK FILE TYPE
    # -----------------------------------------------------

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG, and WEBP "
                "images are allowed."
            )
        )

    # -----------------------------------------------------
    # READ IMAGE
    # -----------------------------------------------------

    contents = await file.read()

    # -----------------------------------------------------
    # CHECK IMAGE SIZE
    # -----------------------------------------------------

    if len(contents) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                "Image must be 2 MB or smaller."
            )
        )

    # -----------------------------------------------------
    # GET FILE EXTENSION
    # -----------------------------------------------------

    extension = Path(
        file.filename or ""
    ).suffix.lower()

    # -----------------------------------------------------
    # CREATE UNIQUE FILE NAME
    # -----------------------------------------------------

    timestamp_str = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')
    filename = f"product_{timestamp_str}{extension}"

    # Complete file path
    file_path = UPLOAD_DIR / filename

    # -----------------------------------------------------
    # SAVE IMAGE
    # -----------------------------------------------------

    with open(file_path, "wb") as buffer:
        buffer.write(contents)

    # -----------------------------------------------------
    # RETURN IMAGE INFORMATION
    # -----------------------------------------------------

    return {
        "status": "success",
        "filename": filename,
        "image_path": f"/uploads/{filename}",
        "size_kb": round(len(contents) / 1024, 2)
    }


# =========================================================
# AI PRODUCE QUALITY ANALYZER
# =========================================================

@app.post("/api/ai/analyze-produce")
async def analyze_produce(
    crop_name: str = Form(...),
    file: UploadFile = File(...)
):

    # -----------------------------------------------------
    # CHECK FILE TYPE
    # -----------------------------------------------------

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG, and WEBP "
                "images are allowed."
            )
        )

    # -----------------------------------------------------
    # READ IMAGE
    # -----------------------------------------------------

    image_data = await file.read()

    # -----------------------------------------------------
    # CHECK IMAGE SIZE
    # -----------------------------------------------------

    MAX_SIZE = 2 * 1024 * 1024

    if len(image_data) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=(
                "Image must be 2 MB or smaller."
            )
        )

    # -----------------------------------------------------
    # AI PROMPT
    # -----------------------------------------------------

    prompt = f"""
You are InterOne AI, an agricultural produce
quality assessment assistant for farmers in India.

Analyze the uploaded image of:

Crop / Produce: {crop_name}

IMPORTANT:
- Only identify issues that are visually observable.
- Do not claim laboratory-level certainty.
- If the image is unclear, say that the assessment
  is visual and uncertain.
- Do not invent diseases or defects that cannot
  reasonably be observed.
- Give practical advice for the farmer.

Provide the result using exactly these sections:

**1. Produce Identification**
Identify whether the image appears consistent
with the crop name provided.

**2. Visual Quality**
Give one rating:
Excellent / Good / Fair / B-Grade / Poor

**3. Visible Condition**
Briefly describe the visible condition.

**4. Issues Detected**
List visible issues such as:
- bruising
- discoloration
- cuts
- cracks
- rot-like appearance
- pest damage
- mold-like appearance
- dryness
Only mention issues that are actually visible.

**5. Freshness Assessment**
Give:
Fresh / Moderately Fresh / Needs Quick Sale /
Likely Perishing

This is only a visual estimate.

**6. Recommended Selling Channel**
Choose the most suitable option:

🟢 Direct Marketplace
🟡 Quick Sale
🟠 Food Processing / Value Addition
🔵 Livestock / Feed
🟣 Organic / Compost / Energy Recovery

Explain briefly why.

**7. Farmer Recommendation**
Give 2-4 practical actions the farmer should take.

Keep the answer concise and farmer-friendly.
"""

    # -----------------------------------------------------
    # SEND IMAGE + PROMPT TO GEMINI
    # -----------------------------------------------------

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                prompt,
                {
                    "inline_data": {
                        "mime_type": file.content_type,
                        "data": image_data
                    }
                }
            ]
        )

        return {
            "status": "success",
            "crop": crop_name,
            "analysis": response.text
        }

    except Exception as e:
        return {
            "status": "error",
            "crop": crop_name,
            "analysis": f"AI Analysis Error: {str(e)}"
        }


# =========================================================
# AI CHAT
# =========================================================

@app.post("/api/ai/chat")
def ai_chat(
    req: ChatRequest
):
    try:
        system_prompt = (
            "You are InterOne AI, an agricultural "
            "marketplace assistant in India. "
            "Help farmers sell crops directly, "
            "suggest pricing, and suggest "
            "zero-waste channels."
        )

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=(
                f"{system_prompt}\n\n"
                f"User Question: "
                f"{req.message}"
            )
        )

        return {
            "reply": response.text
        }

    except Exception as e:
        return {
            "reply": f"AI Error: {str(e)}"
        }


# =========================================================
# ZERO-WASTE AI (WITH AUTOMATIC RETRY)
# =========================================================

@app.post("/api/ai/zero-waste")
def zero_waste_analysis(
    req: ZeroWasteRequest
):
    prompt = (
        f"A farmer in {req.location} has "
        f"{req.quantity_kg} kg of "
        f"unsold/surplus "
        f"{req.crop_name} "
        f"in '{req.condition}' condition.\n"

        "Provide a structured zero-waste "
        "strategy with 3 specific local "
        "secondary buyer channels in "
        "South India:\n"

        "1. **Food Processing / Value Addition** "
        "(e.g., pickle/jam makers, dehydration units)\n"

        "2. **Livestock & Feed** "
        "(e.g., cattle farms, poultry feed processors)\n"

        "3. **Organic / Energy Recovery** "
        "(e.g., vermicomposting, biogas units)\n"

        "Include estimated recovery "
        "pricing in INR/kg for each option."
    )

    # Attempt request with gemini-3.6-flash, with a fallback retry loop
    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt
            )
            return {
                "strategy": response.text
            }
        except Exception as e:
            if attempt == 1:
                return {
                    "strategy": f"Google AI Server Busy (503). Please click 'Start Smart Redirection' once more to retry. Details: {str(e)}"
                }


# =========================================================
# MANDI PRICE INTELLIGENCE
# =========================================================

@app.post("/api/ai/mandi-price")
def get_mandi_price_intelligence(
    req: MandiQueryRequest
):
    try:
        prompt = (
            "You are an expert agricultural "
            "economist in South India.\n"

            "Provide a concise Mandi Price "
            "Intelligence report for:\n"

            f"- Crop: {req.crop_name}\n"

            f"- Mandi/Region: "
            f"{req.location}\n\n"

            "FORMATTING RULES:\n"

            "- Do NOT use markdown tables "
            "(no '|' grid lines).\n"

            "- Do NOT use giant '#' or '##' "
            "main titles.\n"

            "- Use simple bold section titles "
            "(e.g. **1. Estimated Market "
            "Benchmark**) and clean bullet "
            "points (*).\n\n"

            "Include:\n"

            "1. **Estimated Market Benchmark**: "
            "Per Kg & Quintal range "
            "(Minimum, Modal, Maximum).\n"

            "2. **Nearby Alternative Mandis**: "
            "Compare rates in 2 neighboring "
            "market hubs.\n"

            "3. **7-Day Price Trend**: "
            "State if prices are UP, DOWN, "
            "or STABLE and why.\n"

            "4. **Best Selling Advice**: "
            "Clear actionable recommendation "
            "for the farmer."
        )

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        return {
            "report": response.text
        }

    except Exception as e:
        return {
            "report": f"Mandi Intel Error: {str(e)}"
        }

        from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Point to double-nested frontend/frontend/dist directory
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        if full_path.startswith("api"):
            return None
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))