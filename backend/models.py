from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime
)

from database import Base

from datetime import datetime


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
    # PRODUCT IMAGE
    # -----------------------------------------------------

    image_path = Column(
        String(255),
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