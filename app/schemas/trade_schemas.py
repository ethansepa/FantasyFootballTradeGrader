from pydantic import BaseModel
from typing import List
from datetime import datetime

class TradeRequest(BaseModel):
    incoming_players: List[str]
    outgoing_players: List[str]

class TradeResponse(BaseModel):
    score: int
    grade: str
    analysis: str
    trade_id: int

class TradeInDB(BaseModel):
    id: int
    incoming_players: List[str]
    outgoing_players: List[str]
    score: int
    analysis: str
    created_at: datetime

    class Config:
        from_attributes = True

class TradeHistory(BaseModel):
    trades: List[TradeInDB] 