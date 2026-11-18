import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import require_admin
from app.models import Question, Quiz
from app.schemas import QuizCreate, QuizDetail, QuizSummary, QuizUpdate, question_to_out

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


def to_detail(quiz: Quiz) -> QuizDetail:
    return QuizDetail(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        time_per_question=quiz.time_per_question,
        is_published=quiz.is_published,
        questions=[question_to_out(q) for q in quiz.questions],
    )


@router.get("", response_model=list[QuizSummary])
async def list_quizzes(db: AsyncSession = Depends(get_db)):
    q = (
        select(Quiz, func.count(Question.id))
        .outerjoin(Question, Question.quiz_id == Quiz.id)
        .group_by(Quiz.id)
        .order_by(Quiz.created_at.desc())
    )
    rows = (await db.execute(q)).all()
    return [
        QuizSummary(
            id=quiz.id, title=quiz.title, description=quiz.description,
            time_per_question=quiz.time_per_question, is_published=quiz.is_published,
            question_count=count,
        )
        for quiz, count in rows
    ]


@router.get("/{quiz_id}", response_model=QuizDetail)
async def get_quiz(quiz_id: str, db: AsyncSession = Depends(get_db)):
    q = select(Quiz).where(Quiz.id == quiz_id).options(selectinload(Quiz.questions))
    quiz = (await db.execute(q)).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    return to_detail(quiz)


@router.post("", response_model=QuizDetail, dependencies=[Depends(require_admin)])
async def create_quiz(body: QuizCreate, db: AsyncSession = Depends(get_db)):
    quiz = Quiz(
        title=body.title, description=body.description,
        time_per_question=body.time_per_question, is_published=body.is_published,
    )
    for i, q in enumerate(body.questions):
        quiz.questions.append(Question(
            position=i, text=q.text, choices=json.dumps(q.choices),
            correct_index=q.correct_index, points=q.points,
        ))
    db.add(quiz)
    await db.commit()
    return await get_quiz(quiz.id, db)


@router.patch("/{quiz_id}", response_model=QuizDetail, dependencies=[Depends(require_admin)])
async def update_quiz(quiz_id: str, body: QuizUpdate, db: AsyncSession = Depends(get_db)):
    q = select(Quiz).where(Quiz.id == quiz_id).options(selectinload(Quiz.questions))
    quiz = (await db.execute(q)).scalar_one_or_none()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    data = body.model_dump(exclude_unset=True)
    for field in ("title", "description", "time_per_question", "is_published"):
        if field in data:
            setattr(quiz, field, data[field])
    if "questions" in data and data["questions"] is not None:
        quiz.questions.clear()
        await db.flush()
        for i, qn in enumerate(data["questions"]):
            quiz.questions.append(Question(
                position=i, text=qn["text"], choices=json.dumps(qn["choices"]),
                correct_index=qn["correct_index"], points=qn.get("points", 1000),
            ))
    await db.commit()
    return await get_quiz(quiz_id, db)


@router.delete("/{quiz_id}", dependencies=[Depends(require_admin)])
async def delete_quiz(quiz_id: str, db: AsyncSession = Depends(get_db)):
    quiz = await db.get(Quiz, quiz_id)
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    await db.delete(quiz)
    await db.commit()
    return {"ok": True}
