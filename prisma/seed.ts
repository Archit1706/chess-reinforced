import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed the database with initial data
 * Run with: npm run db:seed
 */
async function main() {
  console.log('Seeding database...');

  // Create modules and lessons
  const modules = [
    // === BEGINNER MODULES ===
    {
      slug: 'piece-movement',
      title: 'Piece Movement',
      description: 'Learn how each piece moves and captures',
      level: 'beginner',
      order: 1,
      icon: 'Swords',
      lessons: [
        {
          slug: 'pawn-movement',
          title: 'The Pawn',
          description: 'Learn pawn movement, capturing, en passant, and promotion',
          content: `# The Pawn

The pawn is the most numerous piece on the board, with each player starting with 8 pawns.

## Basic Movement
- Pawns move **forward only** (toward the opponent's side)
- They move **one square** at a time
- On their first move, pawns can optionally move **two squares**

## Capturing
- Pawns capture **diagonally**, one square forward
- They cannot capture pieces directly in front of them

## Special Rules

### En Passant
When an opponent's pawn moves two squares and lands beside your pawn, you can capture it "in passing" as if it had only moved one square.

### Promotion
When a pawn reaches the opposite end of the board, it must be promoted to a queen, rook, bishop, or knight.`,
          order: 1,
          difficulty: 1,
          estimatedMinutes: 10,
        },
        {
          slug: 'knight-movement',
          title: 'The Knight',
          description: 'Master the unique L-shaped movement of the knight',
          content: `# The Knight

The knight has the most unique movement pattern in chess.

## Movement Pattern
- Moves in an **L-shape**: 2 squares in one direction, then 1 square perpendicular
- Can also be thought of as 1 square then 2 squares perpendicular
- **Jumps over pieces** - the only piece that can do this!

## Key Characteristics
- Always lands on the opposite color square
- Cannot be blocked by other pieces
- Excellent for forks (attacking two pieces at once)

## Tips
- Knights are strongest in the center of the board
- A knight on the rim is dim (less effective on edges)`,
          order: 2,
          difficulty: 1,
          estimatedMinutes: 10,
        },
        {
          slug: 'bishop-movement',
          title: 'The Bishop',
          description: 'Understand diagonal movement and bishop pairs',
          content: `# The Bishop

Bishops are long-range pieces that control diagonals.

## Movement
- Moves **diagonally** any number of squares
- Cannot jump over pieces
- Each bishop stays on its starting color throughout the game

## The Bishop Pair
- Having both bishops (light and dark squared) is an advantage
- Together they can control all squares on the board

## Strategy
- Bishops thrive in open positions with clear diagonals
- Fianchetto: Developing bishop to b2/g2 or b7/g7 for long-range influence`,
          order: 3,
          difficulty: 1,
          estimatedMinutes: 8,
        },
      ],
    },
    {
      slug: 'basic-tactics',
      title: 'Basic Tactics',
      description: 'Essential tactical patterns every player must know',
      level: 'beginner',
      order: 2,
      icon: 'Target',
      lessons: [
        {
          slug: 'forks',
          title: 'Forks',
          description: 'Attack two pieces at once with a single piece',
          content: `# Forks

A fork is when one piece attacks two or more enemy pieces simultaneously.

## Types of Forks

### Knight Forks
Knights are the best forking pieces because they can't be blocked.
- The "family fork" attacks king and queen
- Royal fork: attacking king, queen, and rook

### Pawn Forks
Pawns can fork pieces on adjacent diagonals.
- Particularly powerful when forking major pieces

### Queen Forks
The queen can fork in any direction.
- Often combined with check for maximum effect

## How to Find Forks
1. Look for enemy pieces on the same color squares (knight forks)
2. Look for pieces that are undefended
3. Check if you can give check while attacking another piece`,
          order: 1,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'pins',
          title: 'Pins',
          description: 'Immobilize pieces by attacking through them',
          content: `# Pins

A pin occurs when a piece cannot move without exposing a more valuable piece behind it.

## Types of Pins

### Absolute Pin
The piece behind is the king - the pinned piece **cannot legally move**.

### Relative Pin
The piece behind is valuable but not the king - moving is legal but costly.

## Creating Pins
- Bishops, rooks, and queens can create pins
- Look for pieces on the same line as the enemy king
- Use pins to immobilize defenders

## Exploiting Pins
1. Attack the pinned piece with pawns or other pieces
2. Add more attackers than they have defenders
3. Win material when the pinned piece cannot move`,
          order: 2,
          difficulty: 2,
          estimatedMinutes: 15,
        },
      ],
    },
    {
      slug: 'checkmate-patterns',
      title: 'Checkmate Patterns',
      description: 'Recognize and execute common checkmate patterns',
      level: 'beginner',
      order: 3,
      icon: 'Crown',
      lessons: [
        {
          slug: 'back-rank-mate',
          title: 'Back Rank Mate',
          description: 'Checkmate on the first or eighth rank',
          content: `# Back Rank Mate

The back rank mate is one of the most common checkmate patterns.

## The Pattern
- The enemy king is trapped on the back rank (1st or 8th rank)
- Usually blocked by its own pawns
- A rook or queen delivers checkmate

## How It Happens
1. King hasn't castled or is back on the first rank
2. No escape squares because of own pawns
3. Rook or queen sweeps in for checkmate

## Prevention
- Create a "luft" (escape square) by moving a pawn
- h3 or g3 (or h6/g6 for Black) gives the king breathing room
- Keep a rook on the back rank for defense`,
          order: 1,
          difficulty: 2,
          estimatedMinutes: 12,
        },
      ],
    },

    // === INTERMEDIATE MODULES ===
    {
      slug: 'opening-principles',
      title: 'Opening Principles',
      description: 'Fundamental concepts for the opening phase',
      level: 'intermediate',
      order: 1,
      icon: 'Lightbulb',
      lessons: [
        {
          slug: 'center-control',
          title: 'Control the Center',
          description: 'Why the center is crucial and how to control it',
          content: `# Control the Center

The center (d4, d5, e4, e5) is the most important area of the board.

## Why the Center Matters
- Pieces in the center control more squares
- Central control enables attack on either flank
- Knights in the center reach 8 squares vs 2 on edges

## Methods of Control

### Direct Control
Place pawns on e4/d4 or e5/d5.
- Classical approach: occupy with pawns
- Provides stable foundation for pieces

### Indirect Control
Attack the center without occupying it.
- Hypermodern approach: control from a distance
- Fianchetto bishops to pressure central squares

## Opening Moves
- 1.e4 and 1.d4 are the most popular
- Both stake a claim in the center immediately
- Black should respond by fighting for central control`,
          order: 1,
          difficulty: 2,
          estimatedMinutes: 15,
        },
      ],
    },
    {
      slug: 'endgame-basics',
      title: 'Endgame Basics',
      description: 'Essential endgame techniques',
      level: 'intermediate',
      order: 2,
      icon: 'Castle',
      lessons: [
        {
          slug: 'king-pawn-endgame',
          title: 'King and Pawn vs King',
          description: 'Win or draw with just a pawn advantage',
          content: `# King and Pawn vs King

The most fundamental endgame - every player must master it.

## Key Concepts

### The Rule of the Square
If the defending king can step into the "square" of the pawn, it can catch it.
- Draw the square from pawn to promotion square
- If king is inside or can enter, it catches the pawn

### Opposition
When kings face each other with one square between.
- The player NOT to move has the opposition
- Critical for pushing the pawn to promotion

### Key Squares
For each pawn, there are "key squares" the attacking king must reach.
- If king reaches key squares, the pawn promotes
- Central pawns: 3 key squares two ranks ahead
- Rook pawns: often draw because king gets trapped`,
          order: 1,
          difficulty: 3,
          estimatedMinutes: 20,
        },
      ],
    },

    // === ADVANCED MODULES ===
    {
      slug: 'popular-openings',
      title: 'Popular Openings',
      description: 'Study the most played chess openings',
      level: 'advanced',
      order: 1,
      icon: 'BookOpen',
      lessons: [
        {
          slug: 'italian-game',
          title: 'Italian Game',
          description: 'Classic opening aiming for center control',
          content: `# The Italian Game

One of the oldest and most popular chess openings.

## Main Line
1. e4 e5
2. Nf3 Nc6
3. Bc4 (The Italian Game begins)

## Key Ideas for White
- Pressure f7 (weakest square for Black)
- Quick development and castling
- Central control with d3 or d4

## Main Variations

### Giuoco Piano (Quiet Game)
3...Bc5 - Both sides develop calmly
4. c3 preparing d4

### Two Knights Defense
3...Nf6 - More aggressive
4. Ng5 attacks f7 immediately

### Evans Gambit
4. b4!? sacrificing a pawn for rapid development

## Plans and Themes
- The f7 square is often a target
- Piece activity over material
- Quick kingside attack possible`,
          order: 1,
          difficulty: 3,
          estimatedMinutes: 25,
        },
      ],
    },
  ];

  // Create modules and lessons in database
  for (const moduleData of modules) {
    const { lessons, ...moduleInfo } = moduleData;

    const module = await prisma.module.upsert({
      where: { slug: moduleInfo.slug },
      update: moduleInfo,
      create: moduleInfo,
    });

    console.log(`Created module: ${module.title}`);

    for (const lessonData of lessons) {
      const lesson = await prisma.lesson.upsert({
        where: { slug: lessonData.slug },
        update: { ...lessonData, moduleId: module.id },
        create: { ...lessonData, moduleId: module.id },
      });
      console.log(`  - Created lesson: ${lesson.title}`);
    }
  }

  // Create sample puzzles
  const puzzles = [
    {
      fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
      moves: 'h5f7',
      themes: 'mateIn1,sacrifice,opening',
      rating: 800,
    },
    {
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      moves: 'e1e8',
      themes: 'mateIn1,backRankMate',
      rating: 600,
    },
    {
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
      moves: 'c4f7,e8f7,d1h5,g7g6,h5e5',
      themes: 'fork,discoveredAttack,sacrifice',
      rating: 1000,
    },
    {
      fen: 'r2qk2r/ppp2ppp/2n1bn2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQkq - 0 7',
      moves: 'c4f7,e8f7,f3g5,f7g8,d1b3',
      themes: 'attack,sacrifice,advantage',
      rating: 1200,
    },
    {
      fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5',
      moves: 'c1g5',
      themes: 'development,pin',
      rating: 900,
    },
  ];

  for (const puzzle of puzzles) {
    await prisma.puzzle.create({
      data: puzzle,
    });
  }

  console.log('Created sample puzzles');

  // Create some famous games for study mode
  const famousGames = [
    {
      white: 'Adolf Anderssen',
      black: 'Lionel Kieseritzky',
      year: 1851,
      event: 'London',
      result: '1-0',
      pgn: '1.e4 e5 2.f4 exf4 3.Bc4 Qh4+ 4.Kf1 b5 5.Bxb5 Nf6 6.Nf3 Qh6 7.d3 Nh5 8.Nh4 Qg5 9.Nf5 c6 10.g4 Nf6 11.Rg1 cxb5 12.h4 Qg6 13.h5 Qg5 14.Qf3 Ng8 15.Bxf4 Qf6 16.Nc3 Bc5 17.Nd5 Qxb2 18.Bd6 Bxg1 19.e5 Qxa1+ 20.Ke2 Na6 21.Nxg7+ Kd8 22.Qf6+ Nxf6 23.Be7# 1-0',
      eco: 'C33',
      themes: 'sacrifice,attack,romantic',
      difficulty: 4,
    },
    {
      white: 'Donald Byrne',
      black: 'Robert James Fischer',
      year: 1956,
      event: 'Rosenwald Memorial',
      result: '0-1',
      pgn: '1.Nf3 Nf6 2.c4 g6 3.Nc3 Bg7 4.d4 O-O 5.Bf4 d5 6.Qb3 dxc4 7.Qxc4 c6 8.e4 Nbd7 9.Rd1 Nb6 10.Qc5 Bg4 11.Bg5 Na4 12.Qa3 Nxc3 13.bxc3 Nxe4 14.Bxe7 Qb6 15.Bc4 Nxc3 16.Bc5 Rfe8+ 17.Kf1 Be6 18.Bxb6 Bxc4+ 19.Kg1 Ne2+ 20.Kf1 Nxd4+ 21.Kg1 Ne2+ 22.Kf1 Nc3+ 23.Kg1 axb6 24.Qb4 Ra4 25.Qxb6 Nxd1 26.h3 Rxa2 27.Kh2 Nxf2 28.Re1 Rxe1 29.Qd8+ Bf8 30.Nxe1 Bd5 31.Nf3 Ne4 32.Qb8 b5 33.h4 h5 34.Ne5 Kg7 35.Kg1 Bc5+ 36.Kf1 Ng3+ 37.Ke1 Bb4+ 38.Kd1 Bb3+ 39.Kc1 Ne2+ 40.Kb1 Nc3+ 41.Kc1 Ra1# 0-1',
      eco: 'D97',
      themes: 'sacrifice,attack,tactical',
      difficulty: 5,
    },
  ];

  for (const game of famousGames) {
    await prisma.famousGame.create({
      data: game,
    });
  }

  console.log('Created famous games');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
