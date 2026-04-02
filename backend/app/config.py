from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/betting_platform"
    
    # API-Football
    api_football_key: str = "dummy_key"
    api_football_base_url: str = "https://v3.football.api-sports.io"
    
    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # League ID: Denmark Superliga
    league_id: int = 271
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
