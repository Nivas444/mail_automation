import os
from typing import Dict
from app.database import SessionLocal
from app.models.app_data import EmailTemplate

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.getenv("DATA_DIR")
if DATA_DIR:
    TEMPLATES_DIR = os.path.join(DATA_DIR, "templates")
else:
    TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

DEFAULT_TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
SUBJECT_FILE = os.path.join(TEMPLATES_DIR, "subject.txt")
BODY_FILE = os.path.join(TEMPLATES_DIR, "body.txt")
DEFAULT_SUBJECT_FILE = os.path.join(DEFAULT_TEMPLATES_DIR, "subject.txt")
DEFAULT_BODY_FILE = os.path.join(DEFAULT_TEMPLATES_DIR, "body.txt")


def _ensure_templates_dir():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)


def _get_or_create_db_template(db) -> EmailTemplate:
    tmpl = db.query(EmailTemplate).first()
    if not tmpl:
        # Determine default subject
        subject_val = "AI Receptionist for {{company}}"
        for filepath in [SUBJECT_FILE, DEFAULT_SUBJECT_FILE]:
            if os.path.exists(filepath):
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        subject_val = f.read()
                        break
                except Exception:
                    pass
        
        # Determine default body
        body_val = (
            "Hi {{name}},\n\n"
            "We help businesses automate customer calls using AI Receptionists.\n\n"
            "Would you be interested in a quick demo?\n\n"
            "Regards,\nNivas"
        )
        for filepath in [BODY_FILE, DEFAULT_BODY_FILE]:
            if os.path.exists(filepath):
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        body_val = f.read()
                        break
                except Exception:
                    pass
        
        tmpl = EmailTemplate(subject=subject_val, body=body_val)
        db.add(tmpl)
        db.commit()
    return tmpl


def load_subject() -> str:
    db = SessionLocal()
    try:
        tmpl = _get_or_create_db_template(db)
        return tmpl.subject or ""
    except Exception as e:
        print(f"Error loading subject from DB: {e}")
        return "AI Receptionist for {{company}}"
    finally:
        db.close()


def load_body() -> str:
    db = SessionLocal()
    try:
        tmpl = _get_or_create_db_template(db)
        return tmpl.body or ""
    except Exception as e:
        print(f"Error loading body from DB: {e}")
        return (
            "Hi {{name}},\n\n"
            "We help businesses automate customer calls using AI Receptionists.\n\n"
            "Would you be interested in a quick demo?\n\n"
            "Regards,\nNivas"
        )
    finally:
        db.close()


def save_subject(content: str):
    db = SessionLocal()
    try:
        tmpl = db.query(EmailTemplate).first()
        if not tmpl:
            tmpl = _get_or_create_db_template(db)
        tmpl.subject = content
        db.commit()
    except Exception as e:
        print(f"Error saving subject to DB: {e}")
        db.rollback()
    finally:
        db.close()


def save_body(content: str):
    db = SessionLocal()
    try:
        tmpl = db.query(EmailTemplate).first()
        if not tmpl:
            tmpl = _get_or_create_db_template(db)
        tmpl.body = content
        db.commit()
    except Exception as e:
        print(f"Error saving body to DB: {e}")
        db.rollback()
    finally:
        db.close()


def render_template(template: str, lead: Dict) -> str:
    """Replace {{name}}, {{email}}, {{company}} with lead data."""
    result = template
    result = result.replace("{{name}}", lead.get("name", ""))
    result = result.replace("{{email}}", lead.get("email", ""))
    result = result.replace("{{company}}", lead.get("company", ""))
    return result


def render_subject(lead: Dict) -> str:
    raw_subject = load_subject()
    rendered = render_template(raw_subject, lead)
    # Replace all newlines/carriage returns with spaces and strip extra whitespace
    cleaned = rendered.replace("\r", "").replace("\n", " ")
    return " ".join(cleaned.split())


def render_body(lead: Dict) -> str:
    return render_template(load_body(), lead)
