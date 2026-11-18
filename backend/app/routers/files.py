import uuid

from fastapi import APIRouter, Depends, File as UploadFileParam, HTTPException, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.core.storage import ensure_bucket, get_s3_client, presigned_get_url
from app.core.config import settings
from app.models import File as FileModel, Folder
from app.schemas import FileOut

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("", response_model=list[FileOut])
async def list_files(folder_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(FileModel).where(FileModel.folder_id == folder_id).order_by(FileModel.name)
    return (await db.execute(q)).scalars().all()


@router.post("/upload", response_model=FileOut, dependencies=[Depends(require_admin)])
async def upload_file(
    folder_id: str | None = None,
    file: UploadFile = UploadFileParam(...),
    db: AsyncSession = Depends(get_db),
):
    ensure_bucket()
    if folder_id and not await db.get(Folder, folder_id):
        raise HTTPException(400, "Folder not found")
    data = await file.read()
    ext = (file.filename or "file").rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin"
    object_name = f"{uuid.uuid4().hex}.{ext}"
    s3 = get_s3_client()
    s3.put_object(Bucket=settings.MINIO_BUCKET, Key=object_name, Body=data, ContentType=file.content_type or "application/octet-stream")
    record = FileModel(
        folder_id=folder_id,
        name=file.filename or object_name,
        object_name=object_name,
        content_type=file.content_type,
        size=len(data),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/{file_id}/download")
async def download_file(file_id: str, db: AsyncSession = Depends(get_db)):
    f = await db.get(FileModel, file_id)
    if not f:
        raise HTTPException(404, "File not found")
    return RedirectResponse(f"/storage/{f.object_name}", status_code=307)


@router.get("/{file_id}/preview")
async def preview_file(file_id: str, db: AsyncSession = Depends(get_db)):
    f = await db.get(FileModel, file_id)
    if not f:
        raise HTTPException(404, "File not found")
    return {"url": f"/storage/{f.object_name}", "content_type": f.content_type, "name": f.name}


@router.delete("/{file_id}", dependencies=[Depends(require_admin)])
async def delete_file(file_id: str, db: AsyncSession = Depends(get_db)):
    f = await db.get(FileModel, file_id)
    if not f:
        raise HTTPException(404, "File not found")
    try:
        get_s3_client().delete_object(Bucket=settings.MINIO_BUCKET, Key=f.object_name)
    except Exception as e:
        print(f"[storage] delete failed: {e}")
    await db.delete(f)
    await db.commit()
    return {"ok": True}
