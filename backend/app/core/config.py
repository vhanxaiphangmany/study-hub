from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://admin:supersecretpassword@localhost:5432/studyhub"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "miniosecretpassword"
    MINIO_BUCKET_NAME: str = "study-files"
    JWT_SECRET: str = "change-me-to-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin1234"
    CORS_ORIGINS: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def MINIO_BUCKET(self) -> str:
        return self.MINIO_BUCKET_NAME

    @property
    def MINIO_ENDPOINT_URL(self) -> str:
        ep = self.MINIO_ENDPOINT.strip()
        return ep if ep.startswith(("http://", "https://")) else f"http://{ep}"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
