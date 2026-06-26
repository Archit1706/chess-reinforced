# Chess Reinforced

A comprehensive chess learning platform built with Next.js, featuring interactive lessons, puzzles, and AI-powered training with Stockfish.

## Features

### Interactive Chess Board
- Fully functional board with legal move validation (chess.js is the rules authority)
- Visual highlighting for possible/last moves, drag-and-drop or click-to-move
- Move history with algebraic notation, undo/redo, board flip
- Custom arrows (used by the in-game **Hint** feature)
- Fully responsive — boards resize to fit any screen

### Structured Learning Path — 12 modules, 65+ interactive lessons
Lessons aren't walls of text: each one interleaves short explanations with
**playable boards** — animated worked examples (```chess mode: animate`) and
hands-on "your move" sandboxes (```chess mode: interactive`).
- **Beginner**: piece movement (incl. rook/queen/king), basic tactics (forks, pins, skewers, discovered attacks, double attack, removing the defender, deflection), checkmate patterns (back-rank, two-rook, queen, smothered, Scholar's, Arabian), rules & special moves (castling, en passant, promotion, draws & stalemate), reading notation
- **Intermediate**: opening principles, endgame basics (K+P, opposition, passed pawns, rook endings, two-bishop mate), middlegame strategy (pawn structure, open files, outposts, good/bad bishops, space), advanced tactics (zwischenzug, windmill, clearance, interference, desperado), strategic thinking (piece values & trading, prophylaxis, two weaknesses, improving your worst piece)
- **Advanced**: popular openings (Italian, Ruy Lopez, Sicilian, French, Caro-Kann, Queen's Gambit, English, London, King's Indian, Scandinavian, Nimzo-Indian), attacking the king (Greek gift, pawn storms), advanced endgames (Lucena, Philidor, bishop & knight mate, the wrong bishop)

### Play vs the Computer
- Adjustable difficulty (ELO 800–2500) via Stockfish, with a pure-JS local engine fallback so the computer always moves (even if the Stockfish CDN is blocked)
- **Hint** button: shows the best move as an on-board arrow (full-strength analysis)
- **Game Review**: move-by-move accuracy, classification (blunder/mistake/…), and per-side accuracy
- Finished games are auto-saved to **My Games** (replay, re-analyze, export PGN)

### Puzzles
- **Daily puzzle** (deterministic per day) — counts toward your stats once per day
- **Practice** puzzles adapted to your rating, filterable by theme
- **Puzzle Rush**: timed gauntlet; best scores persist (localStorage + cross-device DB sync)
- **Review** (spaced repetition): missed puzzles resurface on a Leitner schedule
- Smooth solving UX — correct moves flash and settle before the "Solved!" panel
- Powered by the open Lichess puzzle database (CC0)

### Train Your Mistakes (blunder-to-puzzle)
- After reviewing a saved game, your own blunders and mistakes become
  "find the better move" puzzles, solved right on the board

### Study Famous Games
- Replay annotated classics (Immortal Game, Game of the Century, Opera Game,
  Evergreen Game, Réti–Tartakower) with full move navigation

### Progress Tracking
- Dashboard with ELO, games played, puzzle accuracy, and streaks
- **Activity calendar** — a GitHub-style heatmap built from real puzzle/game/lesson activity
- Achievements unlocked from real stats
- Charts for accuracy and win/loss/draw

### Auth (optional)
- Clerk authentication, wired to **degrade gracefully** — without keys the app
  runs in anonymous guest mode (state in localStorage). With keys, progress,
  games, puzzle attempts, and scores persist server-side per account.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui inspired
- **Chess Logic**: chess.js
- **Board Visualization**: react-chessboard
- **Chess Engine**: Stockfish.js (WASM)
- **State Management**: Zustand
- **Database**: PostgreSQL (Neon / Vercel Postgres) with Prisma ORM
- **Auth**: Clerk (optional — guest mode without keys)
- **Charts**: Recharts
- **Animations**: Framer Motion

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chess-reinforced.git
cd chess-reinforced
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (lessons, puzzles)
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
chess-reinforced/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── lessons/           # Learning modules
│   ├── play/              # Play vs computer
│   ├── puzzles/           # Puzzle modes
│   ├── dashboard/         # User progress
│   └── api/               # API routes
├── components/
│   ├── chess/             # ChessBoard, MoveHistory, EvaluationBar, GameControls,
│   │                      #   PuzzleBoard, GameReview, GameViewer, MistakeTrainer
│   ├── lessons/           # Markdown renderer, LessonBoard, lessonDemos
│   ├── dashboard/         # ActivityHeatmap
│   ├── auth/              # AuthButtons, UserSync (Clerk, gated)
│   ├── ui/                # Reusable UI primitives (Radix / shadcn-style)
│   ├── layout/            # Navbar + layout
│   └── providers/         # Context providers
├── lib/
│   ├── chess.ts           # chess.js helpers (moves, FEN/PGN, openings)
│   ├── stockfish.ts       # Stockfish Web Worker wrapper (singleton)
│   ├── local-engine.ts    # Pure-JS fallback engine (negamax + alpha-beta)
│   ├── analysis.ts        # Post-game review scoring
│   ├── auth.ts            # Clerk server helpers (graceful degradation)
│   ├── puzzles/           # Lichess parsing, repository, client
│   ├── puzzle-rush/        # Best-score repository + client
│   ├── games/             # Saved-games repository + client
│   ├── lessons/           # Lesson repository + client
│   ├── famous-games/      # Study-mode repository + client
│   ├── dashboard/         # Dashboard aggregations (incl. heatmap)
│   ├── db.ts              # Prisma client
│   └── utils.ts           # General utilities
├── store/                 # Zustand stores
│   ├── game-store.ts      # Chess game state
│   ├── user-store.ts      # User progress state
│   └── ui-store.ts        # UI preferences
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript type definitions
└── prisma/
    ├── schema.prisma      # Database schema
    └── seed.ts            # Seed data
```

## Key Components

### ChessBoard
The main interactive chess board component that handles:
- Piece movement via drag-and-drop or click
- Legal move highlighting
- Last move highlighting
- Pawn promotion
- Custom arrows and square highlighting

### Game Store
Zustand store managing:
- Current game state (FEN, moves, game status)
- Move history navigation
- Board configuration
- Engine evaluation

### Stockfish Integration
The Stockfish engine runs in a Web Worker for:
- Non-blocking move calculation
- Position analysis
- Adjustable playing strength

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| ← | Previous move |
| → | Next move |
| ↑ | Go to start |
| ↓ | Go to current position |
| F | Flip board |
| N | New game |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| T | Toggle theme |
| Shift+? | Show shortcuts |

## Database Schema

### Main Entities
- **User**: profile + statistics (ELO, games, puzzle stats, streaks)
- **Module / Lesson**: learning content; **LessonProgress** tracks per-user completion
- **Puzzle**: tactical puzzles (solver-first form); **PuzzleAttempt** logs attempts
- **PuzzleReview**: per-(user, puzzle) Leitner box + due date for spaced repetition
- **PuzzleRushScore**: one row per completed Puzzle Rush run (best-score per mode)
- **GameHistory**: saved games (PGN, result, opening, opponent) — powers My Games
- **FamousGame**: annotated classics for study mode
- **DailyActivity**: per-day activity counts (scaffolding; the dashboard heatmap is
  derived directly from attempts/games/lessons)

## Configuration

### Environment Variables
Copy `.env.example` to `.env` and fill in:
```env
# PostgreSQL (Neon / Vercel Postgres)
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Clerk auth (optional — omit for guest-only mode)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### Stockfish Settings
Adjust in the Play page:
- ELO range: 800-2500
- Analysis depth: 1-25
- Multi-PV lines: 1-5

## API Routes

All routes are Node-runtime, `force-dynamic`, and attribute data to the signed-in
Clerk user when present, otherwise to the shared `guest` user.

### User Progress
- `GET /api/user` — current user (401 when signed out → store falls back to guest)
- `POST /api/user/progress` — save aggregate stats

### Puzzles
- `GET /api/puzzles/daily` — deterministic daily puzzle
- `GET /api/puzzles/random` — random puzzle (rating/theme filters, exclusions)
- `GET /api/puzzles/themes` — theme counts for the filter UI
- `POST /api/puzzles/attempt` — log an attempt + update the spaced-repetition schedule
- `GET /api/puzzles/review` — puzzles due for spaced-repetition review

### Puzzle Rush
- `GET /api/puzzle-rush` — best score per mode
- `POST /api/puzzle-rush` — submit a finished run, returns the new best

### Games (My Games)
- `GET /api/games` — list the user's saved games
- `POST /api/games` — persist a finished game
- `GET /api/games/[id]` — a single game (with PGN)
- `DELETE /api/games/[id]` — delete a saved game

### Lessons
- `GET /api/lessons` — modules + lessons with per-user completion
- `GET /api/lessons/[lesson]` — lesson markdown content
- `POST /api/lessons/[lesson]/complete` — toggle completion

### Famous Games & Dashboard
- `GET /api/famous-games` and `GET /api/famous-games/[id]` — study mode
- `GET /api/dashboard` — aggregated stats, recent attempts, and the activity heatmap

## Development

### Running Tests
```bash
npm run lint
```

### Building for Production
```bash
npm run build
npm start
```

### Database Management
```bash
# Open Prisma Studio
npm run db:studio

# Reset database
npx prisma db push --force-reset
npm run db:seed
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- [Stockfish](https://stockfishchess.org/) - The strongest open source chess engine
- [chess.js](https://github.com/jhlywa/chess.js) - Chess move generation and validation
- [react-chessboard](https://github.com/Clariity/react-chessboard) - React chess board component
- [Lichess](https://lichess.org/) - Inspiration for UI/UX patterns

---

Built with love for chess learners everywhere.
