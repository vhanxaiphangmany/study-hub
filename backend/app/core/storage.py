import logging
import os
from urllib.parse import quote, urlparse

import boto3
from botocore.client import Config

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_s3_client():
    endpoint_url = settings.MINIO_ENDPOINT_URL.replace("minio_storage", "minio-storage")
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name=os.getenv("MINIO_REGION", "ap-south-1"),
    )


def ensure_bucket() -> bool:
    try:
        s3 = get_s3_client()
        try:
            s3.head_bucket(Bucket=settings.MINIO_BUCKET)
            return True
        except Exception as head_error:
            logger.warning("Could not confirm storage bucket '%s': %s", settings.MINIO_BUCKET, head_error)
            if "supabase.co" in settings.MINIO_ENDPOINT_URL.lower():
                return False
            try:
                s3.create_bucket(Bucket=settings.MINIO_BUCKET)
                return True
            except Exception as create_error:
                logger.warning("Bucket initialization skipped for '%s': %s", settings.MINIO_BUCKET, create_error)
                return False
    except Exception as e:
        logger.warning("Storage bucket initialization skipped for '%s': %s", settings.MINIO_BUCKET, e)
        return False


def public_file_url(object_name: str) -> str:
    endpoint = settings.MINIO_ENDPOINT_URL
    if "supabase.co" in endpoint.lower():
        host = urlparse(endpoint).netloc
        key = quote(object_name, safe="/")
        bucket = quote(settings.MINIO_BUCKET, safe="")
        return f"https://{host}/storage/v1/object/public/{bucket}/{key}"
    return f"/storage/{quote(object_name, safe='/')}"


def presigned_get_url(object_name: str, expires: int = 3600) -> str:
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET, "Key": object_name},
        ExpiresIn=expires,
    )
