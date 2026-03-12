from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ENV: str = "development"
    GROQ_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    PORT: int = 8000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
