import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Local database setup
MYSQL_USER = "root"
MYSQL_PASSWORD = "root123" 
MYSQL_HOST = "localhost"
MYSQL_DB = "interone_db"
LOCAL_DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:3306/{MYSQL_DB}"

# Uses DATABASE_URL from Render if available; falls back to local setup
DATABASE_URL = os.getenv("DATABASE_URL", LOCAL_DATABASE_URL)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()