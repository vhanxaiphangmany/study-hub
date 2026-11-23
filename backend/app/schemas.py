import json
from pydantic import BaseModel, Field, computed_field, field_validator

from app.core.storage import public_file_url


# ---------- Auth ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Folder ----------
class FolderCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    parent_id: str | None = None
    description: str | None = None


class FolderUpdate(BaseModel):
    name: str | None = None
    parent_id: str | None = None
    description: str | None = None


class FolderOut(BaseModel):
    id: str
    name: str
    parent_id: str | None
    description: str | None
    model_config = {"from_attributes": True}


# ---------- File ----------
class FileOut(BaseModel):
    id: str
    folder_id: str | None
    name: str
    object_name: str
    content_type: str | None
    size: int
    model_config = {"from_attributes": True}

    @computed_field
    @property
    def file_url(self) -> str:
        return public_file_url(self.object_name)


# ---------- Note ----------
class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str = ""
    folder_id: str | None = None


class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    folder_id: str | None = None


class NoteOut(BaseModel):
    id: str
    folder_id: str | None
    title: str
    content: str
    model_config = {"from_attributes": True}


# ---------- Quiz ----------
class QuestionIn(BaseModel):
    text: str
    choices: list[str] = Field(min_length=2, max_length=6)
    correct_index: int
    points: int = 1000

    @field_validator("correct_index")
    @classmethod
    def check_index(cls, v, info):
        choices = info.data.get("choices")
        if choices is not None and not (0 <= v < len(choices)):
            raise ValueError("correct_index out of range")
        return v


class QuestionOut(BaseModel):
    id: str
    position: int
    text: str
    choices: list[str]
    correct_index: int
    points: int


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    time_per_question: int = 20
    is_published: bool = True
    questions: list[QuestionIn] = []


class QuizUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    time_per_question: int | None = None
    is_published: bool | None = None
    questions: list[QuestionIn] | None = None


class QuizSummary(BaseModel):
    id: str
    title: str
    description: str | None
    time_per_question: int
    is_published: bool
    question_count: int
    model_config = {"from_attributes": True}


class QuizDetail(BaseModel):
    id: str
    title: str
    description: str | None
    time_per_question: int
    is_published: bool
    questions: list[QuestionOut]


def question_to_out(q) -> QuestionOut:
    return QuestionOut(
        id=q.id,
        position=q.position,
        text=q.text,
        choices=json.loads(q.choices),
        correct_index=q.correct_index,
        points=q.points,
    )
