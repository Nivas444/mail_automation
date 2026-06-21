from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.settings_service import load_settings, save_settings

router = APIRouter()


class SettingsSaveRequest(BaseModel):
    sender_email: str
    resend_api_key: str
    delay_seconds: Optional[float] = 5
    landing_page_url: Optional[str] = "https://landing.sortyx.com"
    backend_url: Optional[str] = "http://localhost:8000"


@router.get("")
def get_settings():
    """Return current settings (API key masked)."""
    settings = load_settings()
    # Mask API key for display — return last 4 chars
    api_key = settings.get("resend_api_key", "")
    masked = ("*" * (len(api_key) - 4) + api_key[-4:]) if len(api_key) > 4 else api_key
    return {
        "sender_email": settings.get("sender_email", ""),
        "resend_api_key": settings.get("resend_api_key", ""),  # full key for form population
        "resend_api_key_masked": masked,
        "delay_seconds": settings.get("delay_seconds", 5),
        "landing_page_url": settings.get("landing_page_url", "https://landing.sortyx.com"),
        "backend_url": settings.get("backend_url", "http://localhost:8000"),
    }


@router.post("/save")
def save_settings_endpoint(payload: SettingsSaveRequest):
    """Save settings to config/settings.json."""
    if not payload.sender_email.strip():
        raise HTTPException(status_code=400, detail="Sender email is required.")
    if not payload.resend_api_key.strip():
        raise HTTPException(status_code=400, detail="Resend API key is required.")
    if payload.delay_seconds < 0:
        raise HTTPException(status_code=400, detail="Delay must be >= 0 seconds.")

    save_settings({
        "sender_email": payload.sender_email.strip(),
        "resend_api_key": payload.resend_api_key.strip(),
        "delay_seconds": payload.delay_seconds,
        "landing_page_url": (payload.landing_page_url or "").strip(),
        "backend_url": (payload.backend_url or "http://localhost:8000").strip(),
    })
    return {"message": "Settings saved successfully."}
