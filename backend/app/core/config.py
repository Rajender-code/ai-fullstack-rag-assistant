from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AI FullStack Assistant"
    GROQ_API_KEY: str
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
