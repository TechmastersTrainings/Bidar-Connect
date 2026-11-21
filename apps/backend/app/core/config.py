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
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002,http://127.0.0.1:3003,http://192.168.31.225:3000,http://192.168.31.225:3001,http://192.168.31.225:3002,http://192.168.31.225:3003")
    
    # Database (PostgreSQL in production; SQLite for local sandbox development)
    DATABASE_URL: str = Field(default=os.getenv("DATABASE_URL", "sqlite+aiosqlite:////tmp/bidar_connect.db"))
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

    # Payment Gateway
    PAYMENT_GATEWAY_PROVIDER: str = Field(default="mock")
    RAZORPAY_KEY_ID: str = Field(default="rzp_test_bidarconnect")
    RAZORPAY_KEY_SECRET: str = Field(default="rzp_secret_bidarconnect")
    RAZORPAY_WEBHOOK_SECRET: str = Field(default="rzp_whsec_bidarconnect")

    # Notifications & External Integrations
    NOTIFICATION_PROVIDER: str = Field(default="mock")
    TWILIO_ACCOUNT_SID: str = Field(default="AC_mock_twilio")
    TWILIO_AUTH_TOKEN: str = Field(default="mock_twilio_token")
    TWILIO_FROM_PHONE: str = Field(default="+12055550100")
    WHATSAPP_API_KEY: str = Field(default="mock_wa_key")
    FCM_SERVER_KEY: str = Field(default="mock_fcm_key")
    EMERGENCY_HELPLINE: str = Field(default="+91 8482 112 112")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

