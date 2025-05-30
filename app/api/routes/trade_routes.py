from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.schemas.trade_schemas import TradeRequest, TradeResponse, TradeHistory
from app.services.trade_analyzer import analyze_trade
from app.db.models import Trade

router = APIRouter()

@router.post("/analyze-trade", response_model=TradeResponse)
async def analyze_trade_route(trade: TradeRequest, db: Session = Depends(get_db)):
    """Analyze a fantasy football trade using AI"""
    if not trade.incoming_players or not trade.outgoing_players:
        raise HTTPException(status_code=400, detail="Must specify both incoming and outgoing players")
    
    # Analyze the trade
    score, grade, analysis = analyze_trade(trade.incoming_players, trade.outgoing_players)
    
    # Save to database
    db_trade = Trade(
        incoming_players=trade.incoming_players,
        outgoing_players=trade.outgoing_players,
        score=score,
        analysis=analysis
    )
    db.add(db_trade)
    db.commit()
    db.refresh(db_trade)
    
    return TradeResponse(
        score=score,
        grade=grade,
        analysis=analysis,
        trade_id=db_trade.id
    )

@router.get("/trade-history", response_model=TradeHistory)
async def get_trade_history(db: Session = Depends(get_db)):
    """Get recent trade analyses"""
    trades = db.query(Trade).order_by(Trade.created_at.desc()).limit(20).all()
    return TradeHistory(trades=trades) 