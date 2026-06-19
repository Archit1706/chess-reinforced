# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm start            # Serve production build
npm run lint         # next lint — the ONLY automated check in this repo (no test suite)

npm run db:generate  # prisma generate (regenerate client after schema changes)
npm run db:push      # Push prisma/schema.prisma to SQLite (no migrations used)
npm run db:seed      # tsx prisma/seed.ts — seeds modules/lessons + imports the bundled puzzle sample
npm run db:studio    # Open Prisma Studio
npm run db:import-puzzles            # Import the bundled 800-puzzle sample
npm run db:import-puzzles -- --file <path.csv|.gz>   # Import a Lichess dump (csv or gz)
zstdcat lichess_db_puzzle.csv.zst | npm run db:import-puzzles -- --stdin   # Full dump
```

The datasource is **PostgreSQL** (Neon / Vercel Postgres) — required because
Vercel's filesystem is ephemeral. `DATABASE_URL` is a `postgresql://` URL (see
`.env.example`). For local work, point it at a local Postgres or a Neon dev
branch, e.g. `DATABASE_URL="postgresql://postgres@localhost:5433/chess"`.

There is no test framework wired up. `npm run lint` is the only verification step.

## Architecture

Next.js 14 **App Router**, TypeScript, Tailwind. The app is effectively a **client-side
single-player application**: every page under `app/` is a `'use client'` component, and all
real state lives in browser-side Zustand stores persisted to `localStorage`. Understand this
before assuming server/DB involvement.

### State: Zustand is the runtime source of truth (`store/`)
- **`game-store.ts`** — the chess game. Holds a live `chess.js` `Chess` instance (NOT persisted)
  plus derived flags (`fen`, `turn`, `isCheck`, history, etc.). All mutations go through actions
  that call `lib/chess.ts` helpers and then `set()` the recomputed state. Only board *config*,
  `computerElo`, and `playerColor` are persisted; the game itself resets on reload.
- **`user-store.ts`** — stats, streaks, daily counters. Persists everything to `localStorage`.
  Defaults to a synthetic `'guest'` user. `fetchUser`/`saveProgress` call `/api/user` and
  `/api/user/progress`, but **those API routes do not exist** — calls fail gracefully and fall
  back to guest. ELO is adjusted by a naive ±10 per game.
- **`ui-store.ts`** — UI preferences (theme handled separately via `next-themes`).

### Chess logic (`lib/chess.ts`)
Pure functions wrapping `chess.js` (move validation, FEN/PGN, SAN/UCI conversion, eval
formatting, opening detection). `chess.js` is the authority for legality — never reimplement
rules. `detectOpening` uses a small hardcoded ECO table, not a real database.

### Stockfish engine (`lib/stockfish.ts`)
Module-level **singleton** engine state (not a React/Zustand concern). On `initEngine()` it spins
up a Web Worker from an inline blob that `importScripts` Stockfish 16 **from the unpkg CDN** — so
the engine requires network access at runtime. Communication is UCI text parsed from worker
messages; async results resolve via a `pendingResolvers` map. `next.config.js` sets
`Cross-Origin-Embedder-Policy: require-corp` and `COOP: same-origin` headers (needed for
SharedArrayBuffer / threaded Stockfish) and enables async WebAssembly in webpack.

`lib/analysis.ts` builds on this for **post-game review**: it replays the game, evaluates every
position, and derives per-move centipawn loss, a classification (`classifyMove`), and a
Lichess-style accuracy per side. The engine is normally ELO-limited for *playing*, so analysis
calls `setLimitStrength(false)` first (and restores it after) to evaluate at full strength. The
scoring math is pure and the engine call is injected via an `evaluate` option, so it's testable
without a worker. The `GameReview` component (in `components/chess/`) drives it from the play page.

### Puzzles — fully wired (DB → API → client)
The puzzle feature is the one end-to-end vertical slice through the backend:
- **`lib/puzzles/`** is the data layer. `lichess.ts` parses the open Lichess dump (CC0) and
  **normalizes** each row to "solver-first" form: the raw FEN is *before* the opponent's setup
  move and `moves[0]` is that setup move, so import applies it (via chess.js) and stores the
  resulting FEN + remaining moves. Everything downstream (DB, API, `PuzzleBoard`) assumes
  solver-first, so don't re-introduce the offset. `repository.ts` holds the Prisma queries
  (deterministic daily via FNV hash of the date, count+offset random with rating/theme filters,
  tolerant attempt logging that auto-provisions a `guest` user). `client.ts` wraps the API with a
  bundled `FALLBACK_PUZZLES` set so the page still works if the DB/API is down.
- **`app/api/puzzles/{daily,random,attempt,themes,review}/route.ts`** — Node-runtime, `force-dynamic`
  handlers that delegate to the repository. These are the first real API routes in the app.
- **Spaced repetition**: every attempt updates a `PuzzleReview` (Leitner box + `dueAt`) per
  (user, puzzle) — a miss drops to box 0 (resurfaces in ~10 min), a solve climbs to a longer
  interval. `/api/puzzles/review` serves due puzzles for the current user (signed-in or guest),
  surfaced as the Puzzles page **Review** tab with a due-count badge.
- **`prisma/import-puzzles.ts`** — streaming, fault-tolerant, idempotent importer (batched upserts
  keyed on Lichess PuzzleId; skips malformed rows). Scales from the bundled sample to the full
  multi-million-row dump at flat memory. `prisma/seed.ts` calls it for the bundled sample.
- **`prisma/data/puzzles.sample.csv`** — 800 real Lichess puzzles in the official dump format,
  committed so seeding works offline.

Reading a `.zst` dump directly in Node is unreliable (its skippable-frame/large-window layout
defeats Node's built-in zstd), so the importer's first-class path for the full dump is piping
`zstdcat ... | --stdin`; `--file` handles plain `.csv` and `.gz`.

### Auth & user persistence (Clerk + Postgres)
Authentication is **Clerk**, wired to **degrade gracefully**: a single
`clerkEnabled` flag (presence of `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`) gates the
`ClerkProvider` (`app/layout.tsx`), `clerkMiddleware` (`middleware.ts`), the
navbar auth UI (`components/auth/AuthButtons.tsx`), and `UserSync`. With keys
unset the app runs in anonymous guest mode (localStorage), so it builds and runs
locally before any keys exist.
- **`lib/auth.ts`** — server helpers: `isClerkConfigured`, `getClerkUserId`, and
  `getOrCreateCurrentUser` (lazily provisions a Prisma `User` row keyed on
  `clerkId` from the Clerk profile on first sign-in).
- **`lib/user/repository.ts`** — maps DB rows to the client `User` DTO (deriving
  `winRate`/`puzzleSuccessRate`) and writes whitelisted stat columns.
- **`app/api/user` (GET)** and **`app/api/user/progress` (POST)** — back the
  `user-store` calls that previously had no route; return 401 when signed out so
  the store falls back to guest. `user-store` auto-saves after each game/puzzle/
  lesson via `saveProgress()`. Puzzle attempts are attributed to the signed-in
  user when available, else the guest.

### Rest of the database (`prisma/`) — still scaffolding
The remaining models (Module, Lesson, LessonProgress, GameHistory, DailyActivity, FamousGame) are
defined and seeded but **not yet wired to the UI**: lessons still render from hardcoded arrays in
the page components. Use the puzzle slice (and now the user/auth slice) as the template.

### UI structure
- `app/` — pages: `play` (vs Stockfish), `puzzles` (rush/practice), `lessons`, `dashboard`,
  `settings`. `app/layout.tsx` mounts `Navbar` + `ThemeProvider`.
- `components/chess/` — board and game UI (`ChessBoard`, `PuzzleBoard`, `MoveHistory`,
  `EvaluationBar`, `GameControls`, `GameInfo`); barrel-exported via `index.ts`.
- `components/ui/` — shadcn/ui-style primitives over Radix.
- `types/` — domain types (`chess`, `lesson`, `user`); import via the `@/*` path alias (→ repo root).
- `hooks/useKeyboardShortcuts.ts` — global board/navigation shortcuts (arrows, F flip, N new, etc.).

## Conventions
- Import with the `@/*` alias rooted at the repo root (e.g. `@/lib/chess`, `@/store/game-store`).
- Keep `chess.js` as the rules authority and the Stockfish singleton outside React state.
- When changing `prisma/schema.prisma`, run `db:generate` then `db:push`.
</content>
</invoke>
