from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models import Note
from app.schemas import NoteCreate, NoteOut, NoteUpdate

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=list[NoteOut])
async def list_notes(folder_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Note).where(Note.folder_id == folder_id).order_by(Note.updated_at.desc())
    return (await db.execute(q)).scalars().all()


@router.get("/{note_id}", response_model=NoteOut)
async def get_note(note_id: str, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    return note


@router.post("", response_model=NoteOut, dependencies=[Depends(require_admin)])
async def create_note(body: NoteCreate, db: AsyncSession = Depends(get_db)):
    note = Note(**body.model_dump())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.patch("/{note_id}", response_model=NoteOut, dependencies=[Depends(require_admin)])
async def update_note(note_id: str, body: NoteUpdate, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(note, k, v)
    await db.commit()
    await db.refresh(note)
    return note


@router.delete("/{note_id}", dependencies=[Depends(require_admin)])
async def delete_note(note_id: str, db: AsyncSession = Depends(get_db)):
    note = await db.get(Note, note_id)
    if not note:
        raise HTTPException(404, "Note not found")
    await db.delete(note)
    await db.commit()
    return {"ok": True}
