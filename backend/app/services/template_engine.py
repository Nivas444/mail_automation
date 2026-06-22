import os
from typing import Dict

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


def load_subject() -> str:
    _ensure_templates_dir()
    if not os.path.exists(SUBJECT_FILE):
        # Fall back to default template file from code repository if it exists
        if os.path.exists(DEFAULT_SUBJECT_FILE) and DEFAULT_SUBJECT_FILE != SUBJECT_FILE:
            try:
                with open(DEFAULT_SUBJECT_FILE, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception:
                pass
        return "AI Receptionist for {{company}}"
    with open(SUBJECT_FILE, "r", encoding="utf-8") as f:
        return f.read()


def load_body() -> str:
    _ensure_templates_dir()
    if not os.path.exists(BODY_FILE):
        # Fall back to default template file from code repository if it exists
        if os.path.exists(DEFAULT_BODY_FILE) and DEFAULT_BODY_FILE != BODY_FILE:
            try:
                with open(DEFAULT_BODY_FILE, "r", encoding="utf-8") as f:
                    return f.read()
            except Exception:
                pass
        return (
            "Hi {{name}},\n\n"
            "We help businesses automate customer calls using AI Receptionists.\n\n"
            "Would you be interested in a quick demo?\n\n"
            "Regards,\nNivas"
        )
    with open(BODY_FILE, "r", encoding="utf-8") as f:
        return f.read()


def save_subject(content: str):
    _ensure_templates_dir()
    with open(SUBJECT_FILE, "w", encoding="utf-8") as f:
        f.write(content)


def save_body(content: str):
    _ensure_templates_dir()
    with open(BODY_FILE, "w", encoding="utf-8") as f:
        f.write(content)


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
