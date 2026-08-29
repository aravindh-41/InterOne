from sqlalchemy import Column, Integer, String, Float
from database import Base

class DBListing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    farmer_name = Column(String(100), nullable=False)
    crop_name = Column(String(100), nullable=False)
    quantity_kg = Column(Float, nullable=False)
    price_per_kg = Column(Float, nullable=False)
    location = Column(String(100), nullable=False)
    contact = Column(String(20), nullable=False)