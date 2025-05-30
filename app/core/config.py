from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    app_name: str = "Fantasy Football Trade Grader"
    debug: bool = True
    database_url: str = "sqlite:///trades.db"
    gemini_api_key: str = os.getenv("GEMINI_API_KEY")

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 