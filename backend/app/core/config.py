import os
from pydantic_settings import BaseSettings
from typing import Optional

# Get the path to the backend directory containing the .env file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ENV_FILE = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindSync AI"
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "mindsync_db"
    SECRET_KEY: str = "your-super-secret-key-for-mindsync-ai-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    GEMINI_API_KEY: Optional[str] = None

    class Config:
        env_file = ENV_FILE
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
