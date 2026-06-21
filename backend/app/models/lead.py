from sqlalchemy import Column, Integer, String
from app.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    company = Column(String, nullable=True, default="")
    status = Column(String, default="pending")  # pending | sent | failed
