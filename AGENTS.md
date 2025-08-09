# Repository Guidelines

## Project Structure & Module Organization
- backend/: TypeScript Express + WebSocket API. Key folders: `src/controllers`, `routes`, `services`, `middleware`, `logging`, `utils`. Static assets are served from `backend/public` after frontend build.
- frontend/: Vite + TypeScript SPA. Key folders: `src/views`, `ui`, `dialogs`, `model`, `public/` for static files.
- ios/: Native iOS app (`notebrook.xcodeproj`). Optional for core web dev.
- etc/systemd/: Example unit files (`backend.service`, `frontend.service`).
- migrations/, `schema.sql`: Database schema and migrations.

## Build, Test, and Development Commands
- Backend (API):
  - `cd backend && npm install` — install deps.
  - `npm run dev` — start API with live reload (`tsx`).
  - `npm run start` — start API in production mode.
  - Env: copy `backend/.env.example` to `.env` and adjust.
- Frontend (Web):
  - `cd frontend && npm install`
  - `npm run dev` — Vite dev server.
  - `npm run build` — type-check + production build to `dist/`.
  - `npm run preview` — preview built app.
- Docker (full stack):
  - `docker build -t notebrook .`
  - `docker run --env-file backend/.env -p 3000:3000 notebrook`

## Coding Style & Naming Conventions
- Language: TypeScript (ESM). `strict: true` in both `tsconfig.json`.
- Indentation: 2 spaces; keep lines focused and small functions.
- Filenames: kebab-case (`service-worker.ts`, `chunk-processor.ts`).
- Imports/exports: prefer named exports; avoid default unless ergonomic.
- Linting: no enforced linter; follow existing patterns (semicolons, double quotes in backend, Vite defaults in frontend).

## Testing Guidelines
- No formal test suite configured. If adding tests:
  - Place unit tests near code (`src/**/__tests__` or `*.test.ts`).
  - Frontend: suggest Vitest; Backend: Node + supertest.
  - Keep fast, deterministic tests; aim for meaningful coverage of core logic.

## Commit & Pull Request Guidelines
- Commits: use Conventional Commits (seen in history): `feat: …`, `fix: …`, `chore: …`, `docs: …`.
- PRs: include a clear description, linked issues, repro steps; attach screenshots/GIFs for UI changes; note env or migration changes.
- Checks: run `npm run build` in `frontend` and ensure `backend` starts cleanly before requesting review.

## Security & Configuration Tips
- Never commit secrets. Use `backend/.env` (see `backend/.env.example`).
- Key vars: `DB_PATH`, `API_TOKEN`, `OPENAI_API_KEY`, `OLLAMA_URL`/`OLLAMA_MODEL`, `UPLOAD_DIR`, `DESCRIBE_*`.
- On servers, adapt `etc/systemd/*.service` and set file paths and environment securely.
