from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models.email_log import EmailLog

router = APIRouter()


@router.post("/resend", status_code=status.HTTP_200_OK)
async def resend_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle webhook callbacks from Resend.
    Processes: email.sent, email.delivered, and email.opened.
    """
    try:
        payload = await request.json()
    except Exception:
        return {"status": "error", "message": "Invalid JSON body"}

    event_type = payload.get("type")
    data = payload.get("data", {})

    if event_type == "email.opened":
        email_id = data.get("email_id")
        if email_id:
            log = db.query(EmailLog).filter(EmailLog.resend_email_id == email_id).first()
            if log:
                if not log.opened:
                    log.opened = True
                    log.opened_at = datetime.now(timezone.utc)
                    db.commit()
                    return {"status": "success", "message": "Email log updated to opened"}
                return {"status": "success", "message": "Email already marked opened"}
            return {"status": "ignored", "message": "Email ID not found in database"}
        return {"status": "error", "message": "Missing email_id in data payload"}

    # Just acknowledge other events (email.sent, email.delivered)
    return {"status": "success", "message": f"Acknowledged event type: {event_type}"}
