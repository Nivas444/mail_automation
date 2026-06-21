from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.email_log import EmailLog

router = APIRouter()


def _compute_interest(log: EmailLog) -> str:
    """Classify lead interest based on open/click behaviour."""
    if log.clicked:
        return "hot"
    if log.opened:
        return "warm"
    return "cold"


@router.get("")
def get_logs(
    status: Optional[str] = Query(None, description="Filter: sent | failed"),
    interest: Optional[str] = Query(None, description="Filter: cold | warm | hot"),
    search: Optional[str] = Query(None, description="Search by email or company"),
    db: Session = Depends(get_db),
):
    """Return email logs with optional status/interest filter and search."""
    query = db.query(EmailLog)

    if status and status in ("sent", "failed"):
        query = query.filter(EmailLog.status == status)

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            (EmailLog.recipient_email.ilike(term))
            | (EmailLog.company.ilike(term))
            | (EmailLog.subject.ilike(term))
        )

    logs = query.order_by(EmailLog.sent_at.desc()).all()

    # Apply interest filter post-query (computed field)
    if interest in ("cold", "warm", "hot"):
        logs = [l for l in logs if _compute_interest(l) == interest]

    return [
        {
            "id": log.id,
            "lead_id": log.lead_id,
            "recipient_email": log.recipient_email,
            "company": log.company,
            "subject": log.subject,
            "status": log.status,
            "sent_at": log.sent_at.isoformat() if log.sent_at else None,
            "error_message": log.error_message,
            "opened": log.opened,
            "opened_at": log.opened_at.isoformat() if log.opened_at else None,
            "clicked": log.clicked,
            "clicked_at": log.clicked_at.isoformat() if log.clicked_at else None,
            "click_count": log.click_count or 0,
            "lead_interest": _compute_interest(log),
        }
        for log in logs
    ]


@router.delete("/all")
def delete_all_logs(db: Session = Depends(get_db)):
    """Delete every email log record."""
    deleted = db.query(EmailLog).delete()
    db.commit()
    return {"message": f"Deleted {deleted} log entries."}


@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    """Delete a single email log by ID."""
    log = db.query(EmailLog).filter(EmailLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found.")
    db.delete(log)
    db.commit()
    return {"message": "Log deleted."}
