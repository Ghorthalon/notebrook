# Repository Guidelines

## Project Structure & Module Organization
- `frontend-vue/` – Vue 3 + Vite app. Key folders: `src/components`, `src/views`, `src/stores`, `src/services`, `src/composables`, `src/router`, and static assets in `public/`.
- `backend/` – TypeScript API + WebSocket server. Key folders: `src/controllers`, `src/routes`, `src/services`, `src/utils`, `src/logging`, `src/jobs`. Database files in `schema.sql` and `migrations/`.
- `etc/systemd/` – example unit files for deployment. `dockerfile` – container build (optional).

## Build, Test, and Development Commands
- Frontend
  - `cd frontend-vue && npm install`
  - `npm run dev` – start Vite dev server.
  - `npm run build` – type-check + production build.
  - `npm run preview` – preview production build.
  - `npm run lint` / `npm run format` – ESLint / Prettier.
- Backend
  - `cd backend && npm install`
  - `npm run dev` – start server with `tsx --watch`.
  - `npm run start` – start server once (prod-like).
  - Note: backend was initialized with Bun; Node/npm + tsx is the primary flow.

## Coding Style & Naming Conventions
- General: TypeScript, 2-space indent, small focused modules. File names: lowercase-kebab for modules (e.g., `message-service.ts`), `PascalCase.vue` for Vue SFCs.
- Frontend: Prettier + ESLint enforced; prefer single quotes; composition API; component names in `PascalCase`.
- Backend: Keep semicolons and consistent import quoting (matches current files). Use `PascalCase` for types/classes, `camelCase` for variables/functions.

## Testing Guidelines
- No formal test runner is configured yet. If adding tests:
  - Place unit tests alongside code as `*.spec.ts` or in a `__tests__/` directory.
  - Keep tests fast and deterministic; document manual verification steps in PRs until a runner is introduced.

## Commit & Pull Request Guidelines
- Commits: imperative mood, concise subject (<=72 chars), include scope prefix when helpful, e.g. `frontend: fix message input blur` or `backend: add channel search`.
- PRs must include: clear description, linked issue (if any), screenshots/GIFs for UI changes, manual test steps, and notes on migrations if touching `backend/migrations/`.
- Ensure `npm run lint` (frontend) passes and the app runs locally for both services before requesting review.

## Security & Configuration Tips
- Backend reads environment from `.env` (see `backend/src/config.ts`): important keys include `DB_PATH`, `API_TOKEN`, `UPLOAD_DIR`, `PORT`, `USE_SSL`, `OPENAI_API_KEY`, `OLLAMA_URL`, and related model settings.
- Do not commit secrets. Provide `.env` examples in PRs when adding new variables.
- For local SSL, set `USE_SSL=1` and supply `SSL_KEY/SSL_CERT`, or let the server generate a self-signed pair for development.

