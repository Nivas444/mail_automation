import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.lead import Lead
from app.services.campaign_runner import campaign_state, run_campaign
from app.services.settings_service import load_settings
from app.services.template_engine import load_subject, load_body

router = APIRouter()


def _validate_campaign_prerequisites(db: Session):
    """Check all required conditions before starting a campaign."""
    errors = []

    settings = load_settings()
    if not settings.get("sender_email", "").strip():
        errors.append("Sender email is not configured. Go to Settings.")
    if not settings.get("resend_api_key", "").strip():
        errors.append("Resend API key is not configured. Go to Settings.")

    subject = load_subject()
    body = load_body()
    if not subject.strip():
        errors.append("Subject template is empty. Go to Templates.")
    if not body.strip():
        errors.append("Body template is empty. Go to Templates.")

    pending_count = db.query(Lead).filter(Lead.status == "pending").count()
    if pending_count == 0:
        errors.append("No pending leads found. Upload a spreadsheet or check lead statuses.")

    return errors


@router.post("/start")
async def start_campaign(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Start the email campaign as a background task."""
    if campaign_state.status == "running":
        raise HTTPException(status_code=409, detail="Campaign is already running.")

    errors = _validate_campaign_prerequisites(db)
    if errors:
        raise HTTPException(status_code=400, detail=" | ".join(errors))

    # Reset state and launch
    campaign_state.reset()
    pending_count = db.query(Lead).filter(Lead.status == "pending").count()
    campaign_state.total = pending_count
    campaign_state.status = "running"

    background_tasks.add_task(_run_campaign_background)

    return {"message": "Campaign started.", "total": pending_count}


async def _run_campaign_background():
    try:
        await run_campaign()
    except Exception as e:
        campaign_state.status = "stopped"


@router.post("/stop")
def stop_campaign():
    """Request campaign to stop after current email."""
    if campaign_state.status != "running":
        raise HTTPException(status_code=400, detail="Campaign is not running.")
    campaign_state.request_stop()
    return {"message": "Stop signal sent. Campaign will stop after the current email."}


@router.get("/status")
def get_campaign_status():
    """Return current campaign state."""
    return {
        "status": campaign_state.status,
        "current_email": campaign_state.current_email,
        "current_company": campaign_state.current_company,
        "sent": campaign_state.sent,
        "total": campaign_state.total,
    }
