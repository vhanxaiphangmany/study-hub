from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://admin:supersecretpassword@localhost:5432/studyhub"
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "miniosecretpassword"
    MINIO_BUCKET_NAME: str = "study-files"
    MINIO_REGION: str = "ap-south-1"
    MINIO_SECURE: bool = False
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
        endpoint = self.MINIO_ENDPOINT.strip().rstrip("/")
        if endpoint.startswith(("http://", "https://")):
            return endpoint
        secure = self.MINIO_SECURE or "supabase.co" in endpoint.lower()
        return f"{'https' if secure else 'http'}://{endpoint}"

    @property
    def MINIO_PUBLIC_BASE_URL(self) -> str | None:
        endpoint = self.MINIO_ENDPOINT_URL
        if "supabase.co" not in endpoint.lower():
            return None
        host = endpoint.removeprefix("https://").removeprefix("http://").split("/", 1)[0]
        return f"https://{host}/storage/v1/object/public"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
