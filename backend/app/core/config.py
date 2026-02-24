from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    ENV: str = "development"
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
