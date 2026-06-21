import asyncio
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.lead import Lead
from app.models.email_log import EmailLog
from app.services.template_engine import render_subject, render_body
from app.services.email_sender import send_email
from app.services.settings_service import load_settings


# ── In-memory campaign state ──────────────────────────────────────────────────

class CampaignState:
    def __init__(self):
        self.status: str = "idle"          # idle | running | stopped | completed
        self.current_email: str = ""
        self.current_company: str = ""
        self.sent: int = 0
        self.total: int = 0
        self._stop_flag: bool = False
        self._task: Optional[asyncio.Task] = None

    def reset(self):
        self.status = "idle"
        self.current_email = ""
        self.current_company = ""
        self.sent = 0
        self.total = 0
        self._stop_flag = False
        self._task = None

    def request_stop(self):
        self._stop_flag = True

    @property
    def should_stop(self) -> bool:
        return self._stop_flag


campaign_state = CampaignState()


# ── Campaign runner ───────────────────────────────────────────────────────────

async def run_campaign():
    """
    Async campaign runner. Iterates over pending leads, sends emails one-by-one,
    updates statuses, logs results, and respects the configurable delay.
    """
    db: Session = SessionLocal()
    try:
        leads = db.query(Lead).filter(Lead.status == "pending").all()
        campaign_state.total = len(leads)
        campaign_state.sent = 0
        campaign_state.status = "running"

        if not leads:
            campaign_state.status = "completed"
            return

        settings = load_settings()
        delay = float(settings.get("delay_seconds", 5))

        for lead in leads:
            if campaign_state.should_stop:
                campaign_state.status = "stopped"
                break

            campaign_state.current_email = lead.email
            campaign_state.current_company = lead.company or ""

            lead_dict = {
                "name": lead.name,
                "email": lead.email,
                "company": lead.company or "",
            }

            subject = render_subject(lead_dict)
            body = render_body(lead_dict)

            # Pre-insert EmailLog to get a unique auto-increment id for pixel tracking
            log = EmailLog(
                lead_id=lead.id,
                recipient_email=lead.email,
                company=lead.company or "",
                subject=subject,
                status="sending",
                sent_at=datetime.now(timezone.utc),
                opened=False,
            )
            db.add(log)
            db.commit()

            # Append fallback tracking pixel to the body (converted to HTML)
            backend_url = settings.get("backend_url", "http://localhost:8000").rstrip("/")
            landing_page_url = settings.get("landing_page_url", "").strip()
            tracking_url = f"{backend_url}/api/track/open/{log.id}"
            click_tracking_url = f"{backend_url}/api/track/click/{log.id}"

            # Normalize URLs for matching
            landing_url_no_slash = landing_page_url.rstrip("/")
            landing_url_with_slash = landing_url_no_slash + "/" if landing_url_no_slash else ""

            # ── Plain text body ───────────────────────────────────────────────
            # Replace the raw landing URL in the template with the click URL
            tracked_body = body
            if landing_page_url:
                if landing_url_with_slash and landing_url_with_slash in tracked_body:
                    tracked_body = tracked_body.replace(landing_url_with_slash, click_tracking_url)
                elif landing_url_no_slash and landing_url_no_slash in tracked_body:
                    tracked_body = tracked_body.replace(landing_url_no_slash, click_tracking_url)
            # Do NOT append a raw URL to plain text — keep it clean

            # ── HTML body ─────────────────────────────────────────────────────
            # Convert template body to HTML paragraphs
            html_paragraphs = "".join(
                f"<p style='margin:0 0 14px 0;'>{line if line.strip() else '&nbsp;'}</p>"
                for line in body.split("\n")
            )

            from urllib.parse import urlparse
            try:
                parsed = urlparse(landing_page_url)
                display_label = parsed.netloc or parsed.path or landing_page_url
                display_label = display_label.rstrip("/")
            except Exception:
                display_label = "Visit our website"

            url_found = False
            if landing_page_url:
                if landing_url_with_slash and landing_url_with_slash in html_paragraphs:
                    html_paragraphs = html_paragraphs.replace(
                        landing_url_with_slash,
                        f'<a href="{click_tracking_url}" style="color:#7c3aed;text-decoration:underline;font-weight:600;">{display_label}</a>'
                    )
                    url_found = True
                elif landing_url_no_slash and landing_url_no_slash in html_paragraphs:
                    html_paragraphs = html_paragraphs.replace(
                        landing_url_no_slash,
                        f'<a href="{click_tracking_url}" style="color:#7c3aed;text-decoration:underline;font-weight:600;">{display_label}</a>'
                    )
                    url_found = True

            if url_found:
                cta_button = ""  # link already in body
            else:
                # Add a CTA button below the body
                btn_label = "Visit Our Website"
                if landing_page_url:
                    try:
                        domain = urlparse(landing_page_url).netloc or landing_page_url
                        btn_label = f"Visit {domain}"
                    except Exception:
                        pass
                cta_button = f"""
                <p style="margin:28px 0 0 0;text-align:center;">
                  <a href="{click_tracking_url}"
                     style="display:inline-block;background:#7c3aed;color:#ffffff;
                            font-family:Arial,sans-serif;font-size:15px;font-weight:600;
                            text-decoration:none;padding:12px 32px;border-radius:8px;
                            letter-spacing:0.3px;">
                    {btn_label}
                  </a>
                </p>"""

            html_body = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:600px;width:100%;">
        <!-- Header bar -->
        <tr><td style="background:#7c3aed;padding:24px 40px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.3px;">SortyX</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px 24px 40px;color:#1a1a1a;font-size:15px;line-height:1.7;">
          {html_paragraphs}
          {cta_button}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px 28px 40px;border-top:1px solid #f0f0f0;color:#999999;font-size:12px;line-height:1.6;">
          You received this email because we believe our solution could help your business.
          <img src="{tracking_url}" width="1" height="1" style="display:none;border:0;" alt="" />
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

            # First attempt
            success, error, resend_id = send_email(lead.email, subject, tracked_body, html_body)

            # Retry once on failure
            if not success:
                await asyncio.sleep(2)
                success, error, resend_id = send_email(lead.email, subject, tracked_body, html_body)

            # Update lead status
            lead.status = "sent" if success else "failed"

            # Update existing EmailLog
            log.status = "sent" if success else "failed"
            log.resend_email_id = resend_id
            log.error_message = error if not success else ""
            log.sent_at = datetime.now(timezone.utc)
            db.commit()

            if success:
                campaign_state.sent += 1

            # Delay before next email (skip delay after last)
            if lead != leads[-1] and not campaign_state.should_stop:
                await asyncio.sleep(delay)

        else:
            # Loop completed without break
            campaign_state.status = "completed"

    except Exception as e:
        campaign_state.status = "stopped"
        raise e
    finally:
        db.close()
        campaign_state.current_email = ""
        campaign_state.current_company = ""


def start_campaign_task(background_tasks_runner):
    """Called from the API to launch the campaign as an asyncio task."""
    loop = asyncio.get_event_loop()
    task = loop.create_task(run_campaign())
    campaign_state._task = task
    campaign_state._stop_flag = False
