import resend
from typing import Tuple, Optional
from app.services.settings_service import load_settings


def send_email(to_email: str, subject: str, body: str, html_body: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
    """
    Send a single email via Resend API (supporting plain text or html).
    Returns (success: bool, error_message: str, resend_email_id: str | None).
    """
    settings = load_settings()

    api_key = (settings.get("resend_api_key") or "").strip()
    sender_email = (settings.get("sender_email") or "").strip()

    if not api_key:
        return False, "Resend API key is not configured.", None
    if not sender_email:
        return False, "Sender email is not configured.", None

    resend.api_key = api_key

    # Ensure subject has no newlines/carriage returns and no excess whitespace
    clean_subject = subject.replace("\r", "").replace("\n", " ")
    clean_subject = " ".join(clean_subject.split())

    try:
        params: resend.Emails.SendParams = {
            "from": sender_email,
            "to": [to_email],
            "subject": clean_subject,
        }
        if html_body:
            params["html"] = html_body
        else:
            params["text"] = body

        r = resend.Emails.send(params)
        email_id = getattr(r, "id", None) or (r.get("id") if isinstance(r, dict) else None)
        return True, "", email_id
    except Exception as e:
        return False, str(e), None

