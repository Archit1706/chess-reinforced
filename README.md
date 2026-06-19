# Chess Reinforced

A comprehensive chess learning platform built with Next.js, featuring interactive lessons, puzzles, and AI-powered training with Stockfish.

## Features

### Interactive Chess Board
- Fully functional board with legal move validation
- Visual highlighting for possible moves
- Move history with algebraic notation
- Undo/redo functionality
- Board flip option
- Drag and drop or click-to-move

### Structured Learning Path
- **Beginner**: Piece movement, basic tactics (forks, pins, skewers), checkmate patterns
- **Intermediate**: Opening principles, middle game strategy, endgame basics
- **Advanced**: Popular openings (Italian, Sicilian, Queen's Gambit), positional play

### Daily Practice System
- Daily chess puzzle with varying difficulty
- Streak tracking for consistent practice
- Puzzle Rush mode: solve as many puzzles as possible in 5 minutes

### Built-in Chess Engine (Stockfish)
- Computer opponent with adjustable difficulty (ELO 800-2500)
- Real-time position analysis
- Best move suggestions
- Post-game analysis

### Progress Tracking
- User dashboard with statistics
- ELO progression charts
- Games played (wins/losses/draws)
- Puzzles solved with success rate
- Daily streak calendar

### Game Modes
- Play vs Computer (with difficulty selection)
- Puzzle Rush (timed puzzle solving)
- Practice puzzles (unlimited)
- Position practice
- Study famous games

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
│   ├── chess/             # Chess-specific components
│   │   ├── ChessBoard.tsx
│   │   ├── MoveHistory.tsx
│   │   ├── EvaluationBar.tsx
│   │   ├── GameControls.tsx
│   │   └── PuzzleBoard.tsx
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components
│   └── providers/         # Context providers
├── lib/
│   ├── chess.ts           # Chess utility functions
│   ├── stockfish.ts       # Stockfish engine wrapper
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
- **User**: Player profile and statistics
- **Module**: Learning modules (Beginner, Intermediate, Advanced)
- **Lesson**: Individual lessons with content
- **Puzzle**: Tactical puzzles with solutions
- **GameHistory**: Saved games
- **DailyActivity**: Streak tracking

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

### User Progress
- `GET /api/user` - Get current user
- `POST /api/user/progress` - Save progress

### Puzzles
- `GET /api/puzzles/daily` - Get daily puzzle
- `GET /api/puzzles/random` - Get random puzzle
- `POST /api/puzzles/attempt` - Record attempt

### Lessons
- `GET /api/lessons` - List all lessons
- `GET /api/lessons/[id]` - Get lesson content
- `POST /api/lessons/[id]/complete` - Mark complete

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
