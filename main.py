# main.py - FastAPI Backend
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.api.routes import trade_routes
from app.api.routes import player_routes
from app.core.config import get_settings
from app.db.database import engine
from app.db.models import Base
from app.services.player_service import player_service
import asyncio
import logging

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize settings
settings = get_settings()

# Initialize FastAPI app
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware with more permissive configuration for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Add all frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Exposes all headers
)

# Include routers
app.include_router(trade_routes.router, prefix="/api")
app.include_router(player_routes.router, prefix="/api")

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse('static/index.html')

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    """Initialize player data on startup"""
    try:
        logging.info("Fetching initial player data...")
        await player_service.fetch_players()
        logging.info("Initial player data fetch complete")
    except Exception as e:
        logging.error(f"Error during startup: {str(e)}")
        # Don't raise the exception - let the application start anyway
        # Players will be fetched on the first request

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)