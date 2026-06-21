from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.template_engine import (
    load_subject,
    load_body,
    save_subject,
    save_body,
    render_template,
)

router = APIRouter()


class TemplateSaveRequest(BaseModel):
    subject: str
    body: str


@router.get("")
def get_templates():
    """Return current subject and body templates."""
    return {
        "subject": load_subject(),
        "body": load_body(),
    }


@router.post("/save")
def save_templates(payload: TemplateSaveRequest):
    """Save subject and body template files."""
    if not payload.subject.strip():
        raise HTTPException(status_code=400, detail="Subject template cannot be empty.")
    if not payload.body.strip():
        raise HTTPException(status_code=400, detail="Body template cannot be empty.")
    save_subject(payload.subject)
    save_body(payload.body)
    return {"message": "Templates saved successfully."}


@router.post("/preview")
def preview_template():
    """Return a rendered preview using a sample lead."""
    sample = {"name": "John", "email": "john@example.com", "company": "ABC Ltd"}
    return {
        "subject": render_template(load_subject(), sample),
        "body": render_template(load_body(), sample),
    }
