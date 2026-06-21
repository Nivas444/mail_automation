from fastapi import APIRouter, Depends
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models.email_log import EmailLog
from app.services.settings_service import load_settings

router = APIRouter()


@router.get("/open/{email_log_id}")
def track_open(email_log_id: int, db: Session = Depends(get_db)):
    """
    Tracking pixel endpoint.
    Finds the email log by ID, marks it as opened if not already,
    and returns a 1x1 transparent GIF.
    """
    from fastapi import Response
    log = db.query(EmailLog).filter(EmailLog.id == email_log_id).first()
    if log:
        if not log.opened:
            log.opened = True
            log.opened_at = datetime.now(timezone.utc)
            db.commit()

    # 1x1 transparent GIF bytes
    gif_data = b"GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"

    headers = {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
    }

    return Response(content=gif_data, media_type="image/gif", headers=headers)


@router.get("/click/{email_log_id}")
def track_click(email_log_id: int, db: Session = Depends(get_db)):
    """
    Click tracking endpoint.
    Marks the email log as clicked, increments click_count,
    then redirects the recipient to the configured landing page.
    """
    settings = load_settings()
    landing_url = settings.get("landing_page_url", "https://landing.sortyx.com").strip()
    if not landing_url:
        landing_url = "https://landing.sortyx.com"

    # Ensure the landing URL has a schema prefix so redirect works correctly
    if not (landing_url.startswith("http://") or landing_url.startswith("https://")):
        landing_url = "https://" + landing_url

    log = db.query(EmailLog).filter(EmailLog.id == email_log_id).first()
    if log:
        log.clicked = True
        log.clicked_at = datetime.now(timezone.utc)
        log.click_count = (log.click_count or 0) + 1
        db.commit()

    return RedirectResponse(url=landing_url, status_code=302)
