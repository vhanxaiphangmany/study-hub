from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models import Folder
from app.schemas import FolderCreate, FolderOut, FolderUpdate

router = APIRouter(prefix="/api/folders", tags=["folders"])


@router.get("", response_model=list[FolderOut])
async def list_folders(parent_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Folder).where(Folder.parent_id == parent_id).order_by(Folder.name)
    return (await db.execute(q)).scalars().all()


@router.get("/tree", response_model=list[FolderOut])
async def folder_tree(db: AsyncSession = Depends(get_db)):
    return (await db.execute(select(Folder).order_by(Folder.name))).scalars().all()


@router.get("/{folder_id}", response_model=FolderOut)
async def get_folder(folder_id: str, db: AsyncSession = Depends(get_db)):
    folder = await db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    return folder


@router.post("", response_model=FolderOut, dependencies=[Depends(require_admin)])
async def create_folder(body: FolderCreate, db: AsyncSession = Depends(get_db)):
    if body.parent_id and not await db.get(Folder, body.parent_id):
        raise HTTPException(400, "Parent folder not found")
    folder = Folder(**body.model_dump())
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    return folder


@router.patch("/{folder_id}", response_model=FolderOut, dependencies=[Depends(require_admin)])
async def update_folder(folder_id: str, body: FolderUpdate, db: AsyncSession = Depends(get_db)):
    folder = await db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    data = body.model_dump(exclude_unset=True)
    if data.get("parent_id") == folder_id:
        raise HTTPException(400, "Folder cannot be its own parent")
    for k, v in data.items():
        setattr(folder, k, v)
    await db.commit()
    await db.refresh(folder)
    return folder


@router.delete("/{folder_id}", dependencies=[Depends(require_admin)])
async def delete_folder(folder_id: str, db: AsyncSession = Depends(get_db)):
    folder = await db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Folder not found")
    await db.delete(folder)
    await db.commit()
    return {"ok": True}
