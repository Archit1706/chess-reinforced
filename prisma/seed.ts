import { PrismaClient } from '@prisma/client';
import { importPuzzles } from './import-puzzles';

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

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1
caption: Your move — capture diagonally with exd5.
\`\`\`

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
        {
          slug: 'rook-movement',
          title: 'The Rook',
          description: 'Master straight-line movement and the power of connected rooks',
          content: `# The Rook

Rooks are powerful long-range pieces worth about five pawns.

## Movement
- Moves in **straight lines** — horizontally and vertically
- Any number of squares, but **cannot jump** over pieces
- Captures by landing on an enemy piece

## Where Rooks Belong
- **Open files** (columns with no pawns) are a rook's highway
- A rook on the **7th rank** attacks the enemy's pawns and traps the king
- **Connected rooks** (defending each other on a rank) are very strong

## Castling
The rook takes part in castling — the only move where two pieces move at once. The king slides two squares toward a rook, and the rook jumps to the king's other side, tucking the king to safety.`,
          order: 4,
          difficulty: 1,
          estimatedMinutes: 8,
        },
        {
          slug: 'queen-movement',
          title: 'The Queen',
          description: 'Command the board with the most powerful piece',
          content: `# The Queen

The queen is the most powerful piece, combining the moves of a rook and a bishop.

## Movement
- Moves in **straight lines and diagonals**
- Any number of squares in any of the eight directions
- Cannot jump over pieces

## Using the Queen Well
- Worth about **nine pawns** — never trade it cheaply
- **Don't bring it out too early** — opponents develop pieces while chasing it, gaining time
- Devastating in the attack once your other pieces are developed

## A Word of Caution
Because the queen is so valuable, it makes a poor blockader and a tempting target. Keep it active but safe from forks and pins.`,
          order: 5,
          difficulty: 1,
          estimatedMinutes: 8,
        },
        {
          slug: 'king-movement',
          title: 'The King',
          description: 'Protect your king and activate it in the endgame',
          content: `# The King

The king is the piece you cannot afford to lose — checkmate ends the game.

## Movement
- Moves **one square** in any direction
- Cannot move into check (a square attacked by an enemy piece)
- Two kings can never stand on adjacent squares

## The King in Two Phases
- **Opening and middlegame:** keep the king safe, usually by castling behind a wall of pawns
- **Endgame:** with fewer pieces around, the king becomes a **fighting piece** — march it toward the center to support pawns and attack

## Castling Rights
You may castle only if neither the king nor that rook has moved, the squares between are empty, and the king is not in check or passing through an attacked square.`,
          order: 6,
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

\`\`\`chess
mode: animate
fen: 4q1k1/8/8/8/4N3/8/8/6K1 w - - 0 1
moves: Nf6+ Kh8 Nxe8
autoplay: true
caption: Nf6+ forks the king and queen, then the knight grabs the queen.
\`\`\`

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
        {
          slug: 'skewers',
          title: 'Skewers',
          description: 'Force a valuable piece to move and win the one behind it',
          content: `# Skewers

A skewer is a pin in reverse: a **more valuable** piece is attacked and forced to move, exposing a **less valuable** piece behind it.

## How It Works
- Line up your rook, bishop, or queen against two enemy pieces
- The front piece is the more valuable one (often the king or queen)
- When it moves out of danger, you capture the piece behind

\`\`\`chess
mode: animate
fen: 1q6/8/8/1k6/8/8/6K1/7R w - - 0 1
moves: Rb1+ Kc5 Rxb8
autoplay: true
caption: Rb1+ checks the king through the b-file; when it steps aside, Rxb8 wins the queen.
\`\`\`

## Skewer vs Pin
- **Pin:** the valuable piece is *behind* and cannot move
- **Skewer:** the valuable piece is *in front* and must move

## Finding Skewers
1. Look for enemy king and queen (or queen and rook) on the same line
2. Deliver a check or threat that forces the front piece to move
3. Capture the piece that was hiding behind it`,
          order: 3,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'discovered-attacks',
          title: 'Discovered Attacks',
          description: 'Unleash a hidden attack by moving a piece out of the way',
          content: `# Discovered Attacks

A discovered attack happens when you move one piece and **reveal** an attack from the piece behind it.

## The Mechanism
- A "front" piece sits in front of a long-range piece (rook, bishop, or queen)
- When the front piece moves, it unmasks the attack
- The front piece can also make its **own** threat as it moves — a double whammy

## Discovered Check
The strongest version: the unmasked attack is a **check**. The opponent must respond to the check, so the front piece can grab material with impunity.

## Why They're Deadly
Two pieces attack at once, but the opponent can usually only deal with one threat. Discovered attacks win material more often than almost any other tactic.`,
          order: 4,
          difficulty: 3,
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
        {
          slug: 'two-rook-mate',
          title: 'Two-Rook Checkmate',
          description: 'The "lawnmower" mate that drives the king off the board',
          content: `# Two-Rook Checkmate

Also called the **ladder** or **lawnmower** mate, this is the easiest mate to learn with two heavy pieces.

## The Technique
1. Place one rook to cut off the rank (or file) the king is on
2. Use the second rook to check the king, forcing it back a rank
3. The king retreats; "climb the ladder" by alternating rooks rank by rank
4. Drive the king to the edge, then deliver checkmate

\`\`\`chess
mode: animate
fen: 4k3/8/8/8/8/8/R7/1R5K w - - 0 1
moves: Ra7 Kd8 Rb8#
autoplay: true
caption: One rook seals the 7th rank, the other delivers mate on the 8th.
\`\`\`

## Key Tip
If the king ever moves *toward* your rooks, simply slide the threatened rook far away along its rank — never give up the rook, and keep climbing.`,
          order: 2,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'queen-king-mate',
          title: 'Queen and King Checkmate',
          description: 'Corner the lone king with your queen and king working together',
          content: `# Queen and King vs King

With a queen and king against a lone king, mate is quick — but you must avoid stalemate.

## The Plan
1. Use the queen to **fence the king** toward an edge, staying a knight's-move away
2. Bring your **own king** up to support — the queen alone cannot mate
3. Deliver checkmate with the king guarding the queen

\`\`\`chess
mode: animate
fen: 4k3/8/3K4/8/8/8/8/4Q3 w - - 0 1
moves: Qe7#
caption: With the king on e6 guarding, Qe7 is checkmate.
\`\`\`

## Avoiding Stalemate
The danger is trapping the king with **no legal moves but no check**. Always check that the enemy king keeps a free square until the moment of mate. When in doubt, bring your king closer rather than grabbing with the queen.`,
          order: 3,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'smothered-mate',
          title: 'Smothered Mate',
          description: 'The knight delivers mate while the king is trapped by its own pieces',
          content: `# Smothered Mate

A beautiful pattern where the king is **smothered** by its own pieces and a lone knight delivers checkmate.

## The Classic Pattern (Philidor's Legacy)
1. A knight checks the king in the corner
2. The king's only escape is blocked by its own pieces
3. Often a queen sacrifice forces a rook to block the last escape square
4. The knight returns with checkmate

\`\`\`chess
mode: animate
fen: 6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1
moves: Nf7#
caption: Boxed in by its own rook and pawns, the king falls to the knight on f7.
\`\`\`

## Why It Works
The knight is the only piece that can't be blocked, so when every escape square is occupied by friendly pieces, a single knight check is mate.`,
          order: 4,
          difficulty: 3,
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
        {
          slug: 'develop-pieces',
          title: 'Develop Your Pieces',
          description: 'Get your knights and bishops into the game quickly',
          content: `# Develop Your Pieces

Development means bringing your pieces from their starting squares into active positions. In the opening, **time is everything**.

## The Golden Rules
- **Knights before bishops** — knights have fewer good squares, so commit them first
- **One move per piece** — don't move the same piece twice in the opening without a reason
- **Don't bring the queen out early** — it gets chased and you lose tempo
- **Castle early** to connect your rooks and tuck the king away

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bc4 Bc5 O-O Nf6
autoplay: true
caption: Knights and bishops come out, then White castles — textbook development.
\`\`\`

## Count Your Tempi
Every move that doesn't develop a piece or fight for the center is a move your opponent can use to get ahead. A lead in development can be turned into an attack before the opponent is ready.`,
          order: 2,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'king-safety',
          title: 'King Safety and Castling',
          description: 'Tuck your king away before launching into the middlegame',
          content: `# King Safety and Castling

A king caught in the center is a king in danger. Castling is your fastest route to safety.

## Why Castle
- Moves the king to the side, away from the open central files
- Brings a rook toward the center where it belongs
- Usually completed within the first 6–10 moves

## Kingside vs Queenside
- **Kingside (O-O):** quick and safe, the most common choice
- **Queenside (O-O-O):** brings the rook to an active file faster, but the king is slightly more exposed on c1/c8

## Keep the Shelter Intact
- Avoid pushing the pawns in front of your castled king without a reason
- Watch for sacrifices that rip open your pawn shield
- If the center is closed, you can sometimes delay castling — but never forget about your king`,
          order: 3,
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
        {
          slug: 'rook-endgames',
          title: 'Rook Endgames',
          description: 'The most common endgame — learn the key drawing and winning ideas',
          content: `# Rook Endgames

Rook endgames are the most common of all endgames. "All rook endings are drawn" is an exaggeration — but they are famously resilient.

## The Lucena Position (Winning)
The fundamental **winning** technique when you have a rook and pawn vs rook and your king is in front of the pawn. The method is called **building a bridge**: use your rook to shield the king from checks so the pawn can promote.

## The Philidor Position (Drawing)
The fundamental **drawing** technique for the defender. Keep your rook on the third rank (from your side) to stop the enemy king from advancing; once the pawn is pushed, swing your rook behind to check from the rear.

## Practical Rules of Thumb
- **Rooks belong behind passed pawns** — yours and your opponent's
- **Keep the rook active** — a passive rook tied to defense usually loses
- **Cut off the enemy king** along a file or rank to limit its help
- An **active rook** is often worth more than a pawn`,
          order: 2,
          difficulty: 4,
          estimatedMinutes: 25,
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
        {
          slug: 'ruy-lopez',
          title: 'Ruy Lopez',
          description: 'The "Spanish Torture" — one of the most respected openings in chess',
          content: `# The Ruy Lopez

Named after a 16th-century Spanish priest, the Ruy Lopez remains a top choice at every level.

## Main Line
1. e4 e5
2. Nf3 Nc6
3. Bb5 (attacking the knight that defends e5)

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O
autoplay: true
caption: The Ruy Lopez: White pressures the c6-knight and castles quickly.
\`\`\`

## Key Ideas for White
- Pressure the e5-pawn by attacking its defender on c6
- Build a strong pawn center with a later c3 and d4
- Slow, strategic squeeze — hence the nickname "Spanish Torture"

## Common Variations
- **Morphy Defense:** 3...a6, the main line
- **Berlin Defense:** 3...Nf6, famously solid for Black
- **Exchange Variation:** 4.Bxc6 trading to damage Black's pawns`,
          order: 2,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'sicilian-defense',
          title: 'Sicilian Defense',
          description: "Black's most aggressive and popular answer to 1.e4",
          content: `# The Sicilian Defense

The Sicilian is the most popular and most combative response to 1.e4, scoring well for Black at all levels.

## Starting Moves
1. e4 c5

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3
autoplay: true
caption: The Open Sicilian: Black trades a flank pawn for a central one and free play.
\`\`\`

## Why Play It
- Black fights for the center **asymmetrically** with the c-pawn instead of ...e5
- Leads to rich, imbalanced positions where Black plays for a win
- The half-open c-file gives Black active rook play

## Major Variations
- **Najdorf** (5...a6) — flexible and razor-sharp, a favorite of world champions
- **Dragon** (...g6) — Black fianchettoes and aims down the long diagonal
- **Scheveningen, Classical, Taimanov** — solid central setups`,
          order: 3,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'queens-gambit',
          title: "Queen's Gambit",
          description: 'A classical queenside opening that fights for the center',
          content: `# The Queen's Gambit

One of the oldest and most respected openings, offering a pawn to seize the center.

## Starting Moves
1. d4 d5
2. c4

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3
autoplay: true
caption: The Queen's Gambit Declined: Black supports d5 with ...e6 and develops solidly.
\`\`\`

## It's Not a Real Gambit
White offers the c4-pawn, but Black usually can't keep it safely — after ...dxc4, White regains the pawn with moves like e3 and Bxc4. The point is to **deflect** Black's d5-pawn and dominate the center.

## Main Replies for Black
- **Queen's Gambit Declined** (2...e6) — solid and classical
- **Slav Defense** (2...c6) — supports d5 while keeping the bishop free
- **Queen's Gambit Accepted** (2...dxc4) — grabs the pawn, gives up the center temporarily`,
          order: 4,
          difficulty: 4,
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

  // Only insert the tiny built-in sample if no puzzles exist yet; the real
  // 800-puzzle Lichess import (idempotent upsert) runs at the end of seeding.
  if ((await prisma.puzzle.count()) === 0) {
    for (const puzzle of puzzles) {
      await prisma.puzzle.create({ data: puzzle });
    }
    console.log('Created sample puzzles');
  } else {
    console.log('Puzzles already present — skipping built-in sample');
  }

  // Create some famous games for study mode
  const famousGames = [
    {
      id: 'immortal-game',
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
      id: 'game-of-the-century',
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

  // Reference data with no foreign keys — replace wholesale so re-seeding is
  // clean (and removes any rows from earlier runs that used generated ids).
  await prisma.famousGame.deleteMany({});
  for (const game of famousGames) {
    await prisma.famousGame.create({ data: game });
  }

  console.log('Created famous games');

  // Import the bundled sample of real Lichess puzzles (CC0). For the full set,
  // run `npm run db:import-puzzles` against the downloaded dump.
  const puzzleResult = await importPuzzles({ log: false });
  console.log(`Imported ${puzzleResult.inserted} puzzles (skipped ${puzzleResult.skipped})`);

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
