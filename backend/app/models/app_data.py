from sqlalchemy import Column, Integer, String, Float, Text
from app.database import Base


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    sender_email = Column(String, nullable=True, default="")
    resend_api_key = Column(String, nullable=True, default="")
    delay_seconds = Column(Float, nullable=True, default=5.0)
    backend_url = Column(String, nullable=True, default="http://localhost:8000")
    landing_page_url = Column(String, nullable=True, default="https://landing.sortyx.com")


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=True, default="")
    body = Column(Text, nullable=True, default="")
