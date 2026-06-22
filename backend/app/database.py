from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.getenv("DATA_DIR")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    if DATA_DIR:
        DB_PATH = os.path.join(DATA_DIR, 'email_automation.db')
    else:
        DB_PATH = os.path.join(BASE_DIR, 'email_automation.db')
    DATABASE_URL = f"sqlite:///{DB_PATH}"
else:
    if DATABASE_URL.startswith("sqlite:///"):
        DB_PATH = DATABASE_URL.replace("sqlite:///", "")
    else:
        DB_PATH = None

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
