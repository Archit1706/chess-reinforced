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
npm run db:seed      # tsx prisma/seed.ts — seeds modules/lessons/puzzles
npm run db:studio    # Open Prisma Studio
```

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

### Database (`prisma/`) — defined but largely NOT wired
`schema.prisma` (SQLite) and `seed.ts` define a full model set (User, Module, Lesson, Puzzle,
PuzzleAttempt, LessonProgress, GameHistory, DailyActivity, FamousGame). However there is **no
`app/api/` directory and no usage of `lib/db.ts` in the UI**. Lessons and puzzles shown in the
pages come from **hardcoded sample arrays inside the page components** (e.g. `samplePuzzles` in
`app/puzzles/page.tsx`), not from Prisma. Treat the DB layer as scaffolding for a future backend;
wiring it up means adding API routes and replacing the in-component sample data.

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
