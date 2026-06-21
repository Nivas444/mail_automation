import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.lead import Lead
from app.models.email_log import EmailLog
from app.services.excel_parser import parse_file

router = APIRouter()

UPLOADS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "uploads",
)


@router.post("/upload")
async def upload_leads(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload CSV or XLSX file, parse leads, and insert into DB."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    contents = await file.read()

    try:
        parsed = parse_file(contents, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not parsed:
        raise HTTPException(
            status_code=400,
            detail="No valid leads found in the file. Check column names and email formats.",
        )

    # Save raw file to uploads dir
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    upload_path = os.path.join(UPLOADS_DIR, file.filename)
    with open(upload_path, "wb") as f:
        f.write(contents)

    inserted = 0
    skipped = 0

    for row in parsed:
        existing = db.query(Lead).filter(Lead.email == row["email"]).first()
        if existing:
            skipped += 1
            continue
        lead = Lead(
            name=row["name"],
            email=row["email"],
            company=row.get("company", ""),
            status="pending",
        )
        db.add(lead)
        inserted += 1

    db.commit()

    return {
        "message": f"Upload complete. {inserted} leads added, {skipped} duplicates skipped.",
        "inserted": inserted,
        "skipped": skipped,
    }


@router.get("/interested")
def get_interested_leads(db: Session = Depends(get_db)):
    """Return leads that have clicked the tracking link (Hot leads)."""
    logs = (
        db.query(EmailLog)
        .filter(EmailLog.clicked == True)
        .order_by(EmailLog.clicked_at.desc())
        .all()
    )

    results = []
    for log in logs:
        # Try to get name from the linked Lead record
        lead_name = ""
        if log.lead_id:
            lead = db.query(Lead).filter(Lead.id == log.lead_id).first()
            if lead:
                lead_name = lead.name

        # Determine interest level
        if log.clicked:
            interest = "hot"
        elif log.opened:
            interest = "warm"
        else:
            interest = "cold"

        results.append({
            "id": log.id,
            "lead_id": log.lead_id,
            "name": lead_name,
            "email": log.recipient_email,
            "company": log.company or "",
            "opened_at": log.opened_at.isoformat() if log.opened_at else None,
            "clicked_at": log.clicked_at.isoformat() if log.clicked_at else None,
            "click_count": log.click_count or 0,
            "lead_interest": interest,
        })

    return results


@router.get("")
def get_leads(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get all leads with optional search across name, email, company."""
    query = db.query(Lead)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            (Lead.name.ilike(term))
            | (Lead.email.ilike(term))
            | (Lead.company.ilike(term))
        )
    leads = query.order_by(Lead.id.desc()).all()
    return [
        {
            "id": l.id,
            "name": l.name,
            "email": l.email,
            "company": l.company,
            "status": l.status,
        }
        for l in leads
    ]


@router.delete("/all")
def delete_all_leads(db: Session = Depends(get_db)):
    """Delete all lead records."""
    deleted = db.query(Lead).delete()
    db.commit()
    return {"message": f"Deleted {deleted} leads."}


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    """Delete a lead by ID."""
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted."}
