# StudyHub — Knowledge Library & Interactive Quizzes

[![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MinIO](https://img.shields.io/badge/Object_Storage-MinIO-C72C48?logo=minio&logoColor=white)](https://min.io/)
[![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)

StudyHub brings a personal file-and-notes library together with lively, interactive quizzes. It is a full-stack portfolio project built with Next.js, FastAPI, PostgreSQL, MinIO, and Docker Compose.

## Features

- **Google Drive-style library** with nested folders and file management.
- **Kahoot-style quizzes** with timed, interactive question play.
- **Single-admin access control** for managing folders, files, notes, and quizzes.
- **Instant sharing** with QR codes for the site, folders, and quizzes.
- **Installable PWA** with a responsive, mobile-friendly interface.
- **S3-compatible object storage** for uploaded study materials.
- **Same-origin API and file proxying** for local and HTTPS tunnel access.

## Stack

- Frontend: Next.js App Router, React, Tailwind CSS
- Backend: FastAPI, SQLAlchemy async, PostgreSQL via asyncpg
- Object storage: MinIO
- Local orchestration: Docker Compose

## Quick Start (Docker)

### Requirements

- Docker Desktop or Docker Engine with Compose
- Git

### Run locally

```bash
git clone <your-public-repository-url> study-hub
cd study-hub
```

Copy `.env.example` to `.env` and replace each placeholder with strong local credentials. Also copy `backend/.env.example` to `backend/.env` if you run the backend outside Compose. Do not commit either `.env` file.

Start the full stack from the Compose directory:

```bash
cd docker
docker-compose up -d --build
```

Open the app and API documentation:

- Frontend: <http://localhost:3000>
- FastAPI docs: <http://localhost:8000/docs>
- PostgreSQL host port: `5433`
- MinIO API: <http://localhost:9000>
- MinIO Console: <http://localhost:9001>

The Compose configuration provides local development defaults. For public deployment, replace all development credentials and configure secrets securely. Optional Cloudflare Quick Tunnels can publish the frontend and backend; Quick Tunnel URLs are temporary and may change after container recreation.

## Configuration

- Root `.env.example` documents the full-stack environment settings.
- `backend/.env.example` documents local backend settings.
- Compose service settings are in `docker/docker-compose.yml`.
- The frontend proxies `/api` to FastAPI and `/storage` to MinIO on the internal Compose network.

Never place production secrets in source control, frontend build arguments, or public client-side environment variables.

## Screenshots

Add screenshots to `docs/screenshots/` and update these links when available:

![StudyHub dashboard](docs/screenshots/dashboard.png)

![StudyHub quiz player](docs/screenshots/quiz-player.png)

![StudyHub mobile view](docs/screenshots/mobile.png)

## Project Structure

```text
study-hub/
├── backend/       # FastAPI application and Dockerfile
├── docker/        # Docker Compose stack
├── frontend/      # Next.js application and Dockerfile
├── .env.example   # Safe full-stack configuration template
└── README.md
```

## License

No license is specified yet. Add a `LICENSE` file before inviting reuse or contributions.
