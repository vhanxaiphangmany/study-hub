# StudyHub Backend (FastAPI)

## Setup

```powershell
cd studyhub\backend
py -m venv .venv          # or: python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env     # then edit JWT_SECRET and ADMIN_PASSWORD
python init_minio.py       # create the MinIO bucket (optional; app also does it on startup)
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Default admin login: `admin` / `admin1234` (change in `.env`).

## Notes
- Tables are auto-created on startup (`create_all`). For real migrations, add Alembic later.
- Public read endpoints: GET folders/files/notes/quizzes, file download/preview.
- Admin-only (Bearer JWT): POST/PATCH/DELETE folders, files upload/delete, notes write, quizzes write.
- Get a token: `POST /api/auth/login` with form fields `username`, `password`.
