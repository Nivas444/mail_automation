import json
import os
from dotenv import load_dotenv

# Load .env from the backend root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATA_DIR = os.getenv("DATA_DIR")
if DATA_DIR:
    CONFIG_DIR = os.path.join(DATA_DIR, "config")
else:
    CONFIG_DIR = os.path.join(BASE_DIR, "config")
SETTINGS_FILE = os.path.join(CONFIG_DIR, "settings.json")

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
    _ensure_config_dir()
    if not os.path.exists(SETTINGS_FILE):
        return DEFAULT_SETTINGS.copy()
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        # .env values fill in any blanks left in settings.json
        merged = DEFAULT_SETTINGS.copy()
        merged.update({k: v for k, v in data.items() if v not in ("", None)})
        return merged
    except Exception:
        return DEFAULT_SETTINGS.copy()


def save_settings(settings: dict):
    _ensure_config_dir()
    current = load_settings()
    current.update(settings)
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(current, f, indent=2)
