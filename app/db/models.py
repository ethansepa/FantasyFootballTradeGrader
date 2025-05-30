from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    incoming_players = Column(JSON, nullable=False)
    outgoing_players = Column(JSON, nullable=False)
    score = Column(Integer, nullable=False)
    analysis = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow) 