from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.lead import Lead
from app.models.email_log import EmailLog

router = APIRouter()


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total_leads = db.query(Lead).count()
    sent = db.query(Lead).filter(Lead.status == "sent").count()
    pending = db.query(Lead).filter(Lead.status == "pending").count()
    failed = db.query(Lead).filter(Lead.status == "failed").count()
    opened = db.query(EmailLog).filter(EmailLog.opened == True).count()
    clicked = db.query(EmailLog).filter(EmailLog.clicked == True).count()

    open_rate = 0.0
    if sent > 0:
        open_rate = round((opened / sent) * 100, 1)

    click_rate = 0.0
    if opened > 0:
        click_rate = round((clicked / opened) * 100, 1)

    return {
        "total_leads": total_leads,
        "sent": sent,
        "opened": opened,
        "clicked": clicked,
        "pending": pending,
        "failed": failed,
        "open_rate": open_rate,
        "click_rate": click_rate,
    }
