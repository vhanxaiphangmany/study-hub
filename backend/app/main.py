from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.storage import ensure_bucket
from app.routers import auth, files, folders, notes, quizzes


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    ensure_bucket()
    yield


app = FastAPI(title="StudyHub API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, folders.router, files.router, notes.router, quizzes.router):
    app.include_router(r)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
