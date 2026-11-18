"""Create the MinIO bucket if missing. Run once: python init_minio.py"""
from app.core.storage import ensure_bucket
from app.core.config import settings

if __name__ == "__main__":
    ok = ensure_bucket()
    print(f"Bucket '{settings.MINIO_BUCKET}': {'ready' if ok else 'FAILED'}")
