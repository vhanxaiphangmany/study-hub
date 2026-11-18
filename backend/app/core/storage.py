import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from app.core.config import settings


def get_s3_client():
    endpoint_url = settings.MINIO_ENDPOINT_URL.replace("minio_storage", "minio-storage")
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket() -> bool:
    s3 = get_s3_client()
    try:
        s3.head_bucket(Bucket=settings.MINIO_BUCKET)
        return True
    except ClientError:
        try:
            s3.create_bucket(Bucket=settings.MINIO_BUCKET)
            return True
        except ClientError as e:
            print(f"[storage] failed to create bucket {settings.MINIO_BUCKET}: {e}")
            return False


def presigned_get_url(object_name: str, expires: int = 3600) -> str:
    s3 = get_s3_client()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.MINIO_BUCKET, "Key": object_name},
        ExpiresIn=expires,
    )
