import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def gen_id() -> str:
    return uuid.uuid4().hex[:12]


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Folder(TimestampMixin, Base):
    __tablename__ = "folders"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(String(12), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    children: Mapped[list["Folder"]] = relationship(back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped["Folder | None"] = relationship(back_populates="children", remote_side=[id])
    files: Mapped[list["File"]] = relationship(back_populates="folder", cascade="all, delete-orphan")
    notes: Mapped[list["Note"]] = relationship(back_populates="folder", cascade="all, delete-orphan")


class File(TimestampMixin, Base):
    __tablename__ = "files"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    folder_id: Mapped[str | None] = mapped_column(String(12), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    object_name: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    content_type: Mapped[str | None] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer, default=0)

    folder: Mapped[Folder | None] = relationship(back_populates="files")


class Note(TimestampMixin, Base):
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    folder_id: Mapped[str | None] = mapped_column(String(12), ForeignKey("folders.id", ondelete="CASCADE"), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")

    folder: Mapped[Folder | None] = relationship(back_populates="notes")


class Quiz(TimestampMixin, Base):
    __tablename__ = "quizzes"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    time_per_question: Mapped[int] = mapped_column(Integer, default=20)  # seconds
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)

    questions: Mapped[list["Question"]] = relationship(
        back_populates="quiz", cascade="all, delete-orphan", order_by="Question.position"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(12), primary_key=True, default=gen_id)
    quiz_id: Mapped[str] = mapped_column(String(12), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    choices: Mapped[str] = mapped_column(Text, nullable=False)  # JSON array of strings
    correct_index: Mapped[int] = mapped_column(Integer, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=1000)

    quiz: Mapped[Quiz] = relationship(back_populates="questions")
