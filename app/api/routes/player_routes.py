from fastapi import APIRouter, Query
from typing import List, Dict
from app.services.player_service import player_service

router = APIRouter()

@router.get("/players/search")
async def search_players(q: str = Query(..., min_length=1)) -> List[Dict]:
    """Search for players by name, team, or position"""
    await player_service.fetch_players()  # Ensure players are loaded
    return player_service.search_players(q)

@router.get("/players")
async def get_all_players() -> List[Dict]:
    """Get all players"""
    return await player_service.fetch_players() 