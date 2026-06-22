import json
import os
from dotenv import load_dotenv
from app.database import SessionLocal
from app.models.app_data import SystemSettings

# Load .env from the backend root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATA_DIR = os.getenv("DATA_DIR")
if DATA_DIR:
    CONFIG_DIR = os.path.join(DATA_DIR, "config")
else:
    CONFIG_DIR = os.path.join(BASE_DIR, "config")

DEFAULT_CONFIG_DIR = os.path.join(BASE_DIR, "config")
SETTINGS_FILE = os.path.join(CONFIG_DIR, "settings.json")
DEFAULT_SETTINGS_FILE = os.path.join(DEFAULT_CONFIG_DIR, "settings.json")

# Defaults: read from .env, fall back to empty
try:
    _delay = float(os.getenv("DELAY_SECONDS", "5"))
except ValueError:
    _delay = 5.0

DEFAULT_SETTINGS = {
    "sender_email":  os.getenv("SENDER_EMAIL") or "",
    "resend_api_key": os.getenv("RESEND_API_KEY") or "",
    "delay_seconds": _delay,
    "backend_url": os.getenv("BACKEND_URL") or "http://localhost:8000",
    "landing_page_url": os.getenv("LANDING_PAGE_URL") or "https://landing.sortyx.com",
}


def _ensure_config_dir():
    os.makedirs(CONFIG_DIR, exist_ok=True)


def load_settings() -> dict:
    db = SessionLocal()
    try:
        db_settings = db.query(SystemSettings).first()
        if db_settings:
            # Return from DB
            return {
                "sender_email": db_settings.sender_email or "",
                "resend_api_key": db_settings.resend_api_key or "",
                "delay_seconds": db_settings.delay_seconds if db_settings.delay_seconds is not None else 5.0,
                "backend_url": db_settings.backend_url or "http://localhost:8000",
                "landing_page_url": db_settings.landing_page_url or "https://landing.sortyx.com",
            }
        
        # If DB record is missing, determine defaults and initialize the DB record
        initial_data = DEFAULT_SETTINGS.copy()
        
        # Try loading defaults from JSON files (if they exist)
        for filepath in [SETTINGS_FILE, DEFAULT_SETTINGS_FILE]:
            if os.path.exists(filepath):
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        file_data = json.load(f)
                        initial_data.update({k: v for k, v in file_data.items() if v not in ("", None)})
                        break
                except Exception:
                    pass

        # Save to DB so subsequent calls hit the DB
        new_settings = SystemSettings(
            sender_email=initial_data.get("sender_email", ""),
            resend_api_key=initial_data.get("resend_api_key", ""),
            delay_seconds=float(initial_data.get("delay_seconds", 5.0)),
            backend_url=initial_data.get("backend_url", "http://localhost:8000"),
            landing_page_url=initial_data.get("landing_page_url", "https://landing.sortyx.com")
        )
        db.add(new_settings)
        db.commit()
        return initial_data
    except Exception as e:
        print(f"Error loading settings from DB: {e}")
        return DEFAULT_SETTINGS.copy()
    finally:
        db.close()


def save_settings(settings: dict):
    db = SessionLocal()
    try:
        db_settings = db.query(SystemSettings).first()
        if not db_settings:
            db_settings = SystemSettings()
            db.add(db_settings)
        
        if "sender_email" in settings:
            db_settings.sender_email = settings["sender_email"]
        if "resend_api_key" in settings:
            db_settings.resend_api_key = settings["resend_api_key"]
        if "delay_seconds" in settings:
            try:
                db_settings.delay_seconds = float(settings["delay_seconds"])
            except ValueError:
                pass
        if "backend_url" in settings:
            db_settings.backend_url = settings["backend_url"]
        if "landing_page_url" in settings:
            db_settings.landing_page_url = settings["landing_page_url"]
        
        db.commit()
    except Exception as e:
        print(f"Error saving settings to DB: {e}")
        db.rollback()
    finally:
        db.close()
