import aiohttp
import asyncio
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
import json
import os
from datetime import datetime, timedelta
import logging
import traceback
from fastapi import HTTPException
from pathlib import Path

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG level
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PlayerService:
    def __init__(self):
        # Get the directory where this file is located
        current_dir = Path(__file__).parent
        self.cache_file = current_dir / "player_cache.json"
        self.cache_duration = timedelta(hours=24)
        self.players: List[Dict] = []
        logger.info(f"Initializing PlayerService, cache file: {self.cache_file}")
        self._load_cache()

    def _load_cache(self) -> None:
        """Load player data from cache if it exists and is not expired"""
        try:
            if self.cache_file.exists():
                logger.info(f"Found cache file at {self.cache_file}")
                with open(self.cache_file, 'r') as f:
                    cache = json.load(f)
                    cache_time = datetime.fromisoformat(cache['timestamp'])
                    if (cache_time + self.cache_duration) > datetime.now():
                        self.players = cache['players']
                        logger.info(f"Loaded {len(self.players)} players from cache (cached at {cache_time})")
                    else:
                        logger.info("Cache has expired")
            else:
                logger.info("No cache file found")
        except Exception as e:
            logger.error(f"Error loading cache: {str(e)}\n{traceback.format_exc()}")
            self.players = []

    def _save_cache(self) -> None:
        """Save player data to cache"""
        try:
            cache_data = {
                'timestamp': datetime.now().isoformat(),
                'players': self.players
            }
            # Ensure the directory exists
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.cache_file, 'w') as f:
                json.dump(cache_data, f)
            logger.info(f"Saved {len(self.players)} players to cache at {self.cache_file}")
        except Exception as e:
            logger.error(f"Error saving cache: {str(e)}\n{traceback.format_exc()}")

    def _get_fallback_players(self) -> List[Dict]:
        """Return a fallback list of top NFL players if scraping fails"""
        return [
            {"name": "Christian McCaffrey", "team": "SF", "position": "RB", "display": "Christian McCaffrey (SF - RB)"},
            {"name": "Tyreek Hill", "team": "MIA", "position": "WR", "display": "Tyreek Hill (MIA - WR)"},
            {"name": "Justin Jefferson", "team": "MIN", "position": "WR", "display": "Justin Jefferson (MIN - WR)"},
            {"name": "Ja'Marr Chase", "team": "CIN", "position": "WR", "display": "Ja'Marr Chase (CIN - WR)"},
            {"name": "Travis Kelce", "team": "KC", "position": "TE", "display": "Travis Kelce (KC - TE)"},
            {"name": "Bijan Robinson", "team": "ATL", "position": "RB", "display": "Bijan Robinson (ATL - RB)"},
            {"name": "Stefon Diggs", "team": "BUF", "position": "WR", "display": "Stefon Diggs (BUF - WR)"},
            {"name": "Saquon Barkley", "team": "NYG", "position": "RB", "display": "Saquon Barkley (NYG - RB)"},
            {"name": "Josh Allen", "team": "BUF", "position": "QB", "display": "Josh Allen (BUF - QB)"},
            {"name": "Patrick Mahomes", "team": "KC", "position": "QB", "display": "Patrick Mahomes (KC - QB)"},
            {"name": "Jalen Hurts", "team": "PHI", "position": "QB", "display": "Jalen Hurts (PHI - QB)"},
            {"name": "CeeDee Lamb", "team": "DAL", "position": "WR", "display": "CeeDee Lamb (DAL - WR)"},
            {"name": "Davante Adams", "team": "LV", "position": "WR", "display": "Davante Adams (LV - WR)"},
            {"name": "Austin Ekeler", "team": "LAC", "position": "RB", "display": "Austin Ekeler (LAC - RB)"},
            {"name": "Tony Pollard", "team": "DAL", "position": "RB", "display": "Tony Pollard (DAL - RB)"},
            {"name": "Derrick Henry", "team": "TEN", "position": "RB", "display": "Derrick Henry (TEN - RB)"},
            {"name": "Amon-Ra St. Brown", "team": "DET", "position": "WR", "display": "Amon-Ra St. Brown (DET - WR)"},
            {"name": "Mark Andrews", "team": "BAL", "position": "TE", "display": "Mark Andrews (BAL - TE)"},
            {"name": "DeVonta Smith", "team": "PHI", "position": "WR", "display": "DeVonta Smith (PHI - WR)"},
            {"name": "Kenneth Walker III", "team": "SEA", "position": "RB", "display": "Kenneth Walker III (SEA - RB)"}
        ]

    async def fetch_players(self) -> List[Dict]:
        """Fetch players from cache or FantasyPros"""
        try:
            if not self.players:
                logger.info("No players in memory, fetching from FantasyPros")
                try:
                    await self._fetch_from_fantasypros()
                except Exception as e:
                    logger.error(f"Error fetching from FantasyPros, using fallback data: {str(e)}")
                    self.players = self._get_fallback_players()
                
                if self.players:
                    self._save_cache()
            return self.players
        except Exception as e:
            error_msg = f"Error fetching players: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=str(e))

    async def _fetch_from_fantasypros(self) -> None:
        """Fetch player data from FantasyPros"""
        url = "https://www.fantasypros.com/nfl/rankings/consensus-cheatsheets.php"
        
        try:
            timeout = aiohttp.ClientTimeout(total=30)  # Increased timeout to 30 seconds
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1'
            }
            
            logger.info(f"Fetching data from {url}")
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url, headers=headers, ssl=False) as response:
                    logger.info(f"Received response with status {response.status}")
                    if response.status == 200:
                        html = await response.text()
                        logger.debug(f"Response headers: {response.headers}")
                        logger.debug(f"Received HTML content length: {len(html)}")
                        
                        if len(html) == 0:
                            logger.error("Received empty HTML response")
                            raise HTTPException(status_code=500, detail="Empty response from FantasyPros")
                        
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Try different table selectors
                        table = None
                        table_selectors = [
                            {'id': 'ranking-table'},
                            {'id': 'players-table'},
                            {'class_': 'player-table'},
                            {'class_': 'table'}
                        ]
                        
                        for selector in table_selectors:
                            table = soup.find('table', selector)
                            if table:
                                logger.info(f"Found table using selector: {selector}")
                                break
                        
                        if not table:
                            logger.error("Could not find player table. HTML structure may have changed.")
                            tables = soup.find_all('table')
                            logger.debug(f"Found {len(tables)} tables on the page")
                            for idx, t in enumerate(tables):
                                logger.debug(f"Table {idx}: ID={t.get('id', 'no-id')} Class={t.get('class', 'no-class')}")
                            raise HTTPException(status_code=500, detail="Could not find player table")
                        
                        players = []
                        rows = table.find_all('tr')[1:]  # Skip header row
                        logger.info(f"Found {len(rows)} player rows")
                        
                        for idx, row in enumerate(rows):
                            try:
                                cells = row.find_all('td')
                                if len(cells) >= 2:
                                    player_cell = cells[1]
                                    name_elem = player_cell.find('a')
                                    if name_elem:
                                        name = name_elem.text.strip()
                                        team_pos = player_cell.find('small')
                                        if team_pos:
                                            team_pos_text = team_pos.text.strip('()')
                                            pos, team = team_pos_text.split(' - ') if ' - ' in team_pos_text else (team_pos_text, '')
                                            
                                            player_data = {
                                                'name': name,
                                                'team': team,
                                                'position': pos,
                                                'display': f"{name} ({team} - {pos})"
                                            }
                                            players.append(player_data)
                                            if idx < 5:  # Log first 5 players for debugging
                                                logger.debug(f"Parsed player: {player_data}")
                            except Exception as e:
                                logger.error(f"Error parsing player row {idx}: {str(e)}\n{traceback.format_exc()}")
                                continue
                        
                        if players:
                            self.players = players
                            logger.info(f"Successfully fetched {len(players)} players from FantasyPros")
                        else:
                            logger.warning("No players found in FantasyPros response, using fallback data")
                            self.players = self._get_fallback_players()
                    else:
                        error_msg = f"FantasyPros returned status code: {response.status}"
                        logger.error(error_msg)
                        raise HTTPException(status_code=500, detail=error_msg)
        except asyncio.TimeoutError:
            error_msg = "Timeout while fetching from FantasyPros"
            logger.error(error_msg)
            raise HTTPException(status_code=504, detail=error_msg)
        except Exception as e:
            error_msg = f"Error fetching from FantasyPros: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=str(e))

    def search_players(self, query: str) -> List[Dict]:
        """Search players by name"""
        try:
            if not self.players:
                logger.warning("No players available for search")
                return []

            query = query.lower()
            results = [
                player for player in self.players
                if query in player['name'].lower() or
                   query in player['team'].lower() or
                   query in player['position'].lower()
            ]
            logger.info(f"Found {len(results)} players matching query: {query}")
            return results
        except Exception as e:
            error_msg = f"Error searching players: {str(e)}\n{traceback.format_exc()}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=str(e))

# Create a singleton instance
player_service = PlayerService() 