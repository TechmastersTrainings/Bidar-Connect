import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    APP_NAME: str = "Bidar Connect"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = Field(default="change-me-to-a-secure-random-64-character-key")
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003")
    
    # Database
    DATABASE_URL: str = Field(default="postgresql+asyncpg://postgres:postgres@localhost:5432/bidar_connect")
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # Supabase Auth
    SUPABASE_URL: str = Field(default="https://your-project.supabase.co")
    SUPABASE_ANON_KEY: str = Field(default="your-supabase-anon-key")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="your-supabase-service-role-key")
    SUPABASE_JWT_SECRET: str = Field(default="your-supabase-jwt-secret")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = Field(default="your-cloud-name")
    CLOUDINARY_API_KEY: str = Field(default="your-api-key")
    CLOUDINARY_API_SECRET: str = Field(default="your-api-secret")
    
    # Defaults
    DEFAULT_CURRENCY: str = "INR"
    MIN_PAYOUT_DELAY_SECONDS: int = 300

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
