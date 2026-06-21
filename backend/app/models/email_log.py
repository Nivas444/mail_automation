from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from app.database import Base


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    recipient_email = Column(String, nullable=False)
    company = Column(String, nullable=True, default="")
    subject = Column(String, nullable=True, default="")
    status = Column(String, nullable=False)  # sent | failed
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    error_message = Column(String, nullable=True, default="")
    opened = Column(Boolean, default=False, nullable=False)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    resend_email_id = Column(String, nullable=True, index=True)
    clicked = Column(Boolean, default=False, nullable=False)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    click_count = Column(Integer, default=0, nullable=False)

