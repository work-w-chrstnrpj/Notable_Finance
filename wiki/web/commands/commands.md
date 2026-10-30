# Command Reference (Web Application)

Commands for building, testing, running, and verifying the web application (`notable-finance-web/`).

## Root Web Commands

Run these from `notable-finance-web/` (which hosts the web workspace `package.json`):

| Command | Purpose |
| --- | --- |
| `npm run bootstrap` | Install dependencies for both `application/` and `service/`. |
| `npm run deps:frontend` | Install dependencies for the frontend application only. |
| `npm run deps:backend` | Install dependencies for the backend service only. |
| `npm run dev` | Start both frontend (Next.js) and backend (NestJS) development servers concurrently. |
| `npm run dev:frontend` | Start the Next.js frontend development server only (port 3000). |
| `npm run dev:backend` | Start the NestJS backend service in watch mode only (port 3001). |
| `npm run build` | Build both frontend and backend for production. |
| `npm run build:frontend` | Build the Next.js frontend application (`application/.next`). |
| `npm run build:backend` | Build the NestJS backend service (`service/dist`). |
| `npm run start:frontend` | Start the built Next.js frontend in production mode. |
| `npm run start:backend` | Start the built NestJS backend from `service/dist`. |
| `npm run lint` | Run ESLint checks across both frontend and backend. |
| `npm run typecheck` | Run TypeScript type checks (`tsc --noEmit`) for both frontend and backend. |
| `npm run test` | Run Vitest tests for both frontend and backend. |
| `npm run verify` | Run full CI gate: lint + typecheck + test across both projects. |

## Direct Subdirectory Commands

### Frontend (`notable-finance-web/application/`)

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

### Backend Service (`notable-finance-web/service/`)

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Documentation & Maintenance Checks

Find template placeholders that may still need project-specific updates:

```bash
rg -n "\[Project Name\]|\[State the project goal here\.\]|Suggested Sections|intended to" AGENTS.md wiki
```

Find draft files that should not remain canonical:

```bash
find wiki/ -name "*-draft.md"
```

## Recommended Tooling

- **Linter:** ESLint with TypeScript and React Hooks plugins.
- **Type Checker:** TypeScript (`tsc --noEmit`).
- **Unit / Contract Tests:** Vitest.
- **Component Tests:** React Testing Library.
- **E2E Tests:** Playwright.
