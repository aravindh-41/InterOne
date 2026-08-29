from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

import database
import models

# Auto-create tables in MySQL
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="InterOne API")

# Fix CORS Middleware syntax
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Absolute path resolution for HTML file
BASE_DIR = Path(__file__).resolve().parent
INDEX_HTML_PATH = BASE_DIR / "templates" / "index.html"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)


# Pydantic Schemas
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
    contact: str


# Root Endpoint (Serves raw index.html cleanly without Jinja2 template errors)
@app.get("/", response_class=FileResponse)
def read_root():
    return FileResponse(INDEX_HTML_PATH)


# DATABASE MARKETPLACE ENDPOINTS
@app.get("/api/listings")
def get_listings(db: Session = Depends(database.get_db)):
    listings = db.query(models.DBListing).order_by(models.DBListing.id.desc()).all()
    return listings


@app.post("/api/listings")
def create_listing(req: ListingRequest, db: Session = Depends(database.get_db)):
    new_listing = models.DBListing(
        farmer_name=req.farmer_name,
        crop_name=req.crop_name,
        quantity_kg=req.quantity_kg,
        price_per_kg=req.price_per_kg,
        location=req.location,
        contact=req.contact,
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return {"status": "success", "listing": new_listing}


# AI ENDPOINTS
@app.post("/api/ai/chat")
def ai_chat(req: ChatRequest):
    try:
        system_prompt = (
            "You are InterOne AI, an agricultural marketplace assistant in India. "
            "Help farmers sell crops directly, suggest pricing, and suggest zero-waste channels."
        )
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=f"{system_prompt}\n\nUser Question: {req.message}",
        )
        return {"reply": response.text}
    except Exception as e:
        return {"reply": f"AI Error: {str(e)}"}


@app.post("/api/ai/zero-waste")
def zero_waste_analysis(req: ZeroWasteRequest):
    try:
        prompt = (
            f"A farmer in {req.location} has {req.quantity_kg} kg of unsold/surplus {req.crop_name} "
            f"in '{req.condition}' condition.\n"
            "Provide a structured zero-waste strategy with 3 specific local secondary buyer channels in South India:\n"
            "1. **Food Processing / Value Addition** (e.g., pickle/jam makers, dehydration units)\n"
            "2. **Livestock & Feed** (e.g., cattle farms, poultry feed processors)\n"
            "3. **Organic / Energy Recovery** (e.g., vermicomposting, biogas units)\n"
            "Include estimated recovery pricing in INR/kg for each option."
        )
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        return {"strategy": response.text}
    except Exception as e:
        return {"strategy": f"Analysis Error: {str(e)}"}


@app.post("/api/ai/mandi-price")
def get_mandi_price_intelligence(req: MandiQueryRequest):
    try:
        prompt = (
            f"You are an expert agricultural economist in South India.\n"
            f"Provide a concise Mandi Price Intelligence report for:\n"
            f"- Crop: {req.crop_name}\n"
            f"- Mandi/Region: {req.location}\n\n"
            f"FORMATTING RULES:\n"
            f"- Do NOT use markdown tables (no '|' grid lines).\n"
            f"- Do NOT use giant '#' or '##' main titles.\n"
            f"- Use simple bold section titles (e.g. **1. Estimated Market Benchmark**) and clean bullet points (*).\n\n"
            f"Include:\n"
            f"1. **Estimated Market Benchmark**: Per Kg & Quintal range (Minimum, Modal, Maximum).\n"
            f"2. **Nearby Alternative Mandis**: Compare rates in 2 neighboring market hubs.\n"
            f"3. **7-Day Price Trend**: State if prices are UP, DOWN, or STABLE and why.\n"
            f"4. **Best Selling Advice**: Clear actionable recommendation for the farmer."
        )
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        return {"report": response.text}
    except Exception as e:
        return {"report": f"Mandi Intel Error: {str(e)}"}