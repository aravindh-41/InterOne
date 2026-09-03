from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text
)

from database import Base


# =========================================================
# MARKETPLACE LISTING
# =========================================================

class DBListing(Base):

    __tablename__ = "listings"

    # -----------------------------------------------------
    # PRIMARY KEY
    # -----------------------------------------------------

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    # -----------------------------------------------------
    # FARMER INFORMATION
    # -----------------------------------------------------

    farmer_name = Column(
        String(100),
        nullable=False
    )

    # -----------------------------------------------------
    # PRODUCE INFORMATION
    # -----------------------------------------------------

    crop_name = Column(
        String(100),
        nullable=False
    )

    quantity_kg = Column(
        Float,
        nullable=False
    )

    price_per_kg = Column(
        Float,
        nullable=False
    )

    # -----------------------------------------------------
    # LOCATION & CONTACT
    # -----------------------------------------------------

    location = Column(
        String(100),
        nullable=False
    )

    # GPS coordinates for exact Google Maps location
    latitude = Column(
        Float,
        nullable=True
    )

    longitude = Column(
        Float,
        nullable=True
    )

    contact = Column(
        String(20),
        nullable=False
    )

    # -----------------------------------------------------
    # PRODUCT IMAGE (Stored as Base64 Data String)
    # -----------------------------------------------------

    image_path = Column(
        Text,
        nullable=True
    )

    # -----------------------------------------------------
    # LISTING TIMESTAMPS
    # -----------------------------------------------------

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    expires_at = Column(
        DateTime,
        nullable=False
    )