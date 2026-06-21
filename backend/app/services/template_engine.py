import os
from typing import Dict

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

SUBJECT_FILE = os.path.join(TEMPLATES_DIR, "subject.txt")
BODY_FILE = os.path.join(TEMPLATES_DIR, "body.txt")


def _ensure_templates_dir():
    os.makedirs(TEMPLATES_DIR, exist_ok=True)


def load_subject() -> str:
    _ensure_templates_dir()
    if not os.path.exists(SUBJECT_FILE):
        return "AI Receptionist for {{company}}"
    with open(SUBJECT_FILE, "r", encoding="utf-8") as f:
        return f.read()


def load_body() -> str:
    _ensure_templates_dir()
    if not os.path.exists(BODY_FILE):
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
