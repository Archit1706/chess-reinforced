# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm start            # Serve production build
npm run lint         # next lint — the ONLY automated check in this repo (no test suite)

npm run db:generate  # prisma generate (regenerate client after schema changes)
npm run db:push      # Push prisma/schema.prisma to PostgreSQL (no migrations used)
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
- **`ui-store.ts`** — UI preferences, persisted to `chess-ui-storage`: board display
  (`showCoordinates`/`showLegalMoves`/`highlightLastMove`, all default **on** — beginner-friendly),
  `animationSpeed`, sound (`soundEnabled`/`volume`), analysis (`autoAnalyze`/`showEvaluation`/
  `analysisDepth`), and `opponentBanter` (default **on**, drives the play-page banter). Light/dark
  is separate, via `next-themes`.

### Chess logic (`lib/chess.ts`)
Pure functions wrapping `chess.js` (move validation, FEN/PGN, SAN/UCI conversion, eval
formatting, opening detection, and `buildPv` — replay a UCI principal variation into a
numbered SAN line). `chess.js` is the authority for legality — never reimplement rules.
`detectOpening` uses a small hardcoded ECO table, not a real database.

### Stockfish engine (`lib/stockfish.ts`)
Module-level **singleton** engine state (not a React/Zustand concern). `initEngine()` spawns a
Web Worker directly from `/engine/stockfish-18-lite-single.js` (same-origin) — no CDN dependency,
no supply-chain risk, and same-origin sidesteps the CORP requirement that COEP `require-corp`
otherwise imposes on cross-origin subresources. The engine files are NOT committed; they're
copied from `node_modules/stockfish/bin/` into `/public/engine/` by
**`scripts/setup-engine.mjs`**, wired into both `postinstall` and `build`. Communication is raw
UCI text; searches are serialized through a single in-flight slot with hard timeouts on the init
handshake and every search, so a blocked worker can never leak a pending promise.
`next.config.js` still sets `Cross-Origin-Embedder-Policy: require-corp` and `COOP: same-origin`
(needed for SAB-based engines and other isolated-context APIs) and enables async WebAssembly in
webpack. In an environment **without** cross-origin isolation (some embedded/preview browsers),
the Stockfish worker fails to init → `isEngineReady()` stays false → every best-move/analysis
path falls back to `getLocalBestMove` (which returns a move but no eval or PV). So "no engine
eval / no principal variation" in such a browser is expected, not a bug — verify engine-dependent
UI on the real deployment (or a locally-isolated dev server), and unit-test the pure logic instead.

`lib/local-engine.ts` is a **pure-JS fallback opponent** that guarantees the computer always
moves. Negamax + alpha-beta with iterative deepening, **quiescence search** (depth-bounded,
fail-soft) at horizon nodes, **MVV-LVA** capture ordering, **killer-move** + **history**
heuristics, and a bounded **transposition table** (mate scores deliberately not cached because
distance-to-mate doesn't transfer between positions). The root loop uses a full window and only
jitters scores for tie-breaking (never alpha cutoffs) — this matters: a fail-hard cutoff
combined with jitter at the root used to make captures and quiet moves coin-flips. Per-call
budget scales with ELO (400ms–1200ms). The play page prefers Stockfish when loaded but falls
back to this engine on a timeout, so the computer always replies.

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

### Lessons — wired (DB → API → client)
`Module`/`Lesson` content is seeded (`prisma/seed.ts`) and served from the DB:
- **`lib/lessons/repository.ts`** — `getModulesWithProgress`, `getLessonBySlug`, and
  `setLessonCompleted` (upserts a `LessonProgress` row per (user, lesson), joining completion
  state into the module/lesson DTOs).
- **`app/api/lessons` (GET list), `app/api/lessons/[lesson]` (GET detail), and
  `app/api/lessons/[lesson]/complete` (POST)** — scoped to the signed-in user, else the guest.
- **`components/lessons/Markdown.tsx`** — a tiny, dependency-free, XSS-safe renderer (headings,
  unordered + ordered lists, GitHub-style pipe **tables**, **bold**, *italics*, inline code) for the
  lessons' markdown `content`. It renders to React elements, so it does **not** decode HTML entities
  — never write `&nbsp;`/`&amp;` etc. in lesson content (they show up verbatim); use plain text.
- **`components/lessons/LessonBoard.tsx`** + **`lessonDemos.ts`** — interactive learning aids: an
  `animate` board (steps through legal FEN frames) and an `interactive` sandbox (drag legal moves,
  chess.js-validated). Interactive boards also accept **`respond: true`**, which answers each reader
  move with a light `getLocalBestMove` reply so a drill plays out like a mini-opponent. Two gotchas:
  (1) `onDrop` hardcodes `promotion: 'q'`, so you **cannot** build an interactive underpromotion
  drill — use `animate` for those; (2) the "Game over" badge fires only on `isCheckmate()`/
  `isStalemate()`, deliberately **not** `isGameOver()`, so bare teaching positions (K+N vs K, K vs K
  opposition) that are draws by insufficient material still invite the reader to move. `LESSON_DEMOS`
  keys topic-matched demos by lesson slug at the UI layer (no DB/seed dependency); the lesson page
  also always renders a free practice sandbox.
- **Lesson content style**: lessons are written to be *interactive, not book-like*. Each lesson's
  markdown interleaves short prose with embedded **` ```chess `** blocks — `mode: animate` (a
  worked example that auto-plays a move list) and `mode: interactive` (a "your move" sandbox). The
  Markdown renderer parses these fenced blocks into live boards (an interactive block may also set
  `respond: true`, `flip: true`, `autoplay: true`, `caption:`). There are 13 modules / 65+ lessons;
  **every FEN and move sequence in `seed.ts` and `lessonDemos.ts` must be validated with chess.js**
  before committing (illegal moves silently break the board). The standard check is a scratch `.cjs`
  verifier (in `scripts/`, deleted before committing) that unescapes the ` ```chess ` fences out of
  the template literal and runs **three passes** over every block:
  1. **Legality** — replay `animate` move lists; assert `isCheckmate()` on `#` moves and `isCheck()`
     on `+` moves.
  2. **Dead position** — no `interactive` FEN may load as checkmate/stalemate/insufficient material
     (the board would read "Game over" / never let the reader move).
  3. **Illegal position** — flip the side to move and call `isCheck()`; if true, the side *not* to
     move is already in check (an illegal start). This class is easy to introduce by only checking
     "the move mates" without checking the start was legal.
- Pages: `app/lessons/page.tsx` (real modules + progress) and
  `app/lessons/[module]/[lesson]/page.tsx` (markdown + a persistent "mark complete" toggle that
  also feeds the streak via `recordLessonCompleted`).

### Famous games — wired (DB → API → client)
Seeded `FamousGame` rows power a study mode (currently 5: Immortal Game, Game of the Century, Opera
Game, Evergreen Game, Réti–Tartakower). To add more, append to the `famousGames` array in
`seed.ts` — **validate each PGN with `chess.js` `loadPgn` first**.
- **`lib/famous-games/repository.ts`** + **`app/api/famous-games`** (list) and
  **`app/api/famous-games/[id]`** (detail with PGN).
- **`components/chess/GameViewer.tsx`** — a self-contained PGN replay board (parses with chess.js,
  precomputes per-ply FENs; button/keyboard/click navigation), decoupled from the game store.
- Pages `app/study/page.tsx` (browse) and `app/study/[id]/page.tsx` (replay); reachable via the
  "Study" navbar item.

### Game history / My Games — wired (DB → API → client)
The `GameHistory` model is now fully surfaced:
- **`lib/games/{repository,client,types}.ts`** — `saveGame` (with a per-user cap), `getGames`,
  `getGameById`, `deleteGame`; `deriveOutcome`/`normalizeColor` helpers (color stored as
  `white`/`black`).
- **`app/api/games` (GET list, POST save)** and **`app/api/games/[id]` (GET, DELETE)**.
- The **play page** auto-saves each finished vs-computer game exactly once (guarded ref) with
  opening/result/color/opponent ELO. Pages: `app/games/page.tsx` (list with win/loss/draw badges)
  and `app/games/[id]/page.tsx` (GameViewer replay + on-demand Game Review + **Train Your Mistakes**).
- **`components/chess/MistakeTrainer.tsx`** — turns the analysis of a saved game into "find the
  better move" puzzles from the player's own blunders/mistakes (pure-derived, no DB). Falls back to
  the local engine for the best move when Stockfish never loaded. `GameReview` exposes the analysis
  via an `onAnalyzed` callback.

### Puzzle Rush scores — wired (localStorage + DB)
Best scores persist two ways so they survive reloads and sync across devices:
- **`store/user-store.ts`** keeps a `puzzleRushBest` per mode in localStorage (instant, offline,
  works before any migration).
- **`PuzzleRushScore` model** + **`lib/puzzle-rush/{repository,client}.ts`** + **`app/api/puzzle-rush`**
  (GET best, POST submit) sync server-side. The API degrades gracefully (returns zeros) if the table
  hasn't been pushed yet, so the local best always works. The puzzles page merges local + server best.
- The **daily puzzle** counts toward stats only **once per UTC day** — completion is persisted in
  localStorage (`chess-daily-completed`) so a reload can't re-farm the solved count.

### Dashboard heatmap & achievements
`app/api/dashboard` → `lib/dashboard/repository.ts` aggregates per-user data. The **activity
heatmap** (`components/dashboard/ActivityHeatmap.tsx`, a dependency-free CSS-grid calendar) is
**derived from real logged data** — `PuzzleAttempt`, `GameHistory`, and completed `LessonProgress`
over the last 17 weeks — rather than the `DailyActivity` table (which remains as scaffolding).
Achievements are computed client-side from real `user.stats`.

### Puzzle UX & in-game hints
- **`PuzzleBoard`** flashes a correct move green (`SOLVE_REVEAL_MS`) before the "Solved!" panel, so
  the winning move is visible instead of the board snapping away; feedback overlays show explicit
  "Correct!" / "Try again" labels and an instruction line.
- The **play page** has a **Hint** button: it computes the player's best move (full-strength
  Stockfish when ready, else `getLocalBestMove`) and shows it as a green arrow via `ChessBoard`'s
  `customArrows`; the hint clears on the next move and is disabled when it isn't the player's turn.

### Standalone practice tools, sound & opponent banter (all client-only, no DB)
- **Analysis Board (`app/analysis/page.tsx`)** — a position editor + on-demand engine advisor.
  Keeps its **own** `chess.js` instance (NOT the game store). Local helpers `boardToFen` /
  `fenToBoard` / `tryLoad` back the editor (piece palette place/erase/drag, side-to-move toggle,
  FEN load/copy, presets) and translate chess.js's rejections into plain-language errors. "Best
  move" runs full-strength Stockfish (`setLimitStrength(false)`) with a race timeout and a
  `getLocalBestMove` fallback, shown as an arrow + SAN + eval, plus the engine's **principal
  variation** via `buildPv` ("play move" / "play whole line"). Suggests for whichever side is to
  move; the reader makes replies manually.
- **Coordinates Trainer (`app/coordinates/page.tsx`)** — a 30-second "find the named square" drill
  on a blank board; best score in `localStorage`.
- **Sound (`lib/sound.ts`)** — a dependency-free Web Audio synth (no audio assets); every call is
  gated on `ui-store` `soundEnabled`/`volume`, so callers invoke `playSound(kind)` unconditionally.
  Wired into `game-store` moves and `PuzzleBoard`.
- **Opponent banter (`lib/banter.ts` + `components/chess/OpponentBanter.tsx`)** — the vs-computer
  personality: taunts, praise and coaching lines on the play page, gated by `ui-store.opponentBanter`.
  `deriveBanterEvent` + `banterLine` are **pure and engine-free** — hung-piece/bad-trade detection
  is a material-swing heuristic (an even trade is deliberately NOT flagged). It only speaks on
  notable events (blunder, big capture, check, undo, castle, promotion, game start/end, occasional
  lead nudge), never every move.

### UI structure
- `app/` — pages: `play` (vs Stockfish, with Hint + Game Review), `analysis` (position setup +
  engine best-move/PV advisor), `puzzles` (daily/practice/rush/review), `lessons`, `coordinates`
  (trainer), `games` (My Games + replay/review/mistake-trainer), `study` (famous games),
  `dashboard`, `settings`. `app/layout.tsx` mounts `Navbar` + `ThemeProvider`, wraps children in a
  `<main id="main-content">`, and renders a "Skip to main content" link (WCAG 2.4.1).
- **`Navbar`** (client) shows the labelled links only at `lg+`; below that it collapses to a
  hamburger with the full labels (the labelled bar overflowed in the `md`–`lg` band).
- `components/chess/` — board and game UI (`ChessBoard`, `PuzzleBoard`, `MoveHistory`,
  `EvaluationBar`, `GameControls`, `GameInfo`, `GameReview`, `GameViewer`, `MistakeTrainer`,
  `OpponentBanter`); barrel-exported via `index.ts`.
- `components/ui/` — shadcn/ui-style primitives over Radix.
- `types/` — domain types (`chess`, `lesson`, `user`); import via the `@/*` path alias (→ repo root).
- `hooks/useKeyboardShortcuts.ts` — global board/navigation shortcuts (arrows, F flip, N new, etc.).
  `hooks/useContainerWidth.ts` — feeds `react-chessboard` a live pixel width; wrap the board in a
  `min-w-0` element so it can shrink below its intrinsic size on narrow screens (else it overflows).

## Conventions
- Import with the `@/*` alias rooted at the repo root (e.g. `@/lib/chess`, `@/store/game-store`).
- Keep `chess.js` as the rules authority and the Stockfish singleton outside React state.
- When changing `prisma/schema.prisma`, run `db:generate` then `db:push`.
- **Accessibility**: icon-only buttons and Radix `Switch`/`SelectTrigger` need an `aria-label`
  (they have no visible text). Any UI whose markup depends on `next-themes` (e.g. the Settings
  theme buttons' `variant`) must gate on a `mounted` flag so the first client render matches the
  server — otherwise React logs a hydration mismatch (which can cascade into a noisy dev-only
  "Rendered more hooks" error at the router).
- **Verifying without a test runner**: for tricky *pure* logic (e.g. `buildPv`, `deriveBanterEvent`,
  the lessons three-pass FEN check) write a throwaway `tsx`/`.cjs` script under `scripts/`, run it,
  and delete it before committing. `import type` lines are erased at transpile, so a `tsx` script
  can import from `@/lib/*` modules whose only unresolved imports are types.
- Do **not** run `npm run build` while `npm run dev` is running — the production build overwrites
  the dev server's `.next` and corrupts it; stop dev first, or restart dev afterward.
- The dev-server console buffer accumulates across a tab's whole lifetime (reloads/HMR don't clear
  it); to judge whether an error is current, read it in a **fresh browser tab**.
</content>
</invoke>
