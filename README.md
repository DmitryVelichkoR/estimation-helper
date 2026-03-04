# Studio App

Next.js (App Router) TypeScript app for site estimation. Design studio UI — neutral, calm, spacious.

## Ground Rules

- **No changes** to `analyzer-engine/` unless explicitly requested
- **Communication**: spawn child process (node) calling `analyze-site.mjs`
- **Artifacts**: stored at repo-level `artifacts/<estimateId>/...`

## Install

```bash
cd studio-app
npm install
cp .env.example .env   # if .env doesn't exist
npm run db:push        # create SQLite schema
```

## Run

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Production server (run after build)
npm run start
```

Dev server runs at [http://localhost:3000](http://localhost:3000).

## Test

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Prisma generate + Next.js build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run db:push` | Push Prisma schema to SQLite |

## Pages

- `/` — Landing with "Start estimate" CTA
- `/app` — Redirects to `/app/estimates`
- `/app/estimates` — Estimates list
- `/app/estimates/[id]` — Estimate detail, workspace, run analysis, generate report
- `/app/new` — New estimate form (tech profile + URL)
- `/app/health` — Health check (DB, artifacts writable, analyzer path)

## Health Check

Visit [http://localhost:3000/app/health](http://localhost:3000/app/health) to verify:

- DB connection OK
- Artifacts folder writable
- Analyzer path exists

## Analyzer Integration

- Script: `../analyzer-engine/site-analyzer/analyze-site.mjs`
- Usage: `node analyze-site.mjs <baseUrl> [--max-pages N] [--no-llm] [--model <name>] [--out <dir>] [--debug]`
- To write to shared artifacts: pass `--out ../../artifacts/<estimateId>`
