from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    META_PHONE_NUMBER_ID: str
    META_ACCESS_TOKEN: str
    META_APP_SECRET: str
    META_VERIFY_TOKEN: str

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    DB_PATH: str = "./zomad.db"
    PORT: int = 8000


settings = Settings()
