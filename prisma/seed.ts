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

Pawns are little, but they decide most games. Each side starts with eight of them.

## Push it

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/8/8/4P3/4K3 w - - 0 1
caption: Your move — push the e-pawn one square (or two, from its starting rank).
\`\`\`

A pawn moves **only forward**, one square at a time. From its starting row it can choose **one square or two** — but never after that.

## Capture diagonally

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1
caption: Your move — capture the d5-pawn with exd5.
\`\`\`

Pawns *move* straight but *capture* on the diagonal. The piece directly in front of a pawn is safe from it.

## Reach the end → promote

\`\`\`chess
mode: animate
fen: 4k3/P7/8/8/8/8/8/4K3 w - - 0 1
moves: a8=Q
caption: A pawn that reaches the last rank turns into a queen (or rook, bishop, knight).
\`\`\`

## En passant

If an opponent's pawn jumps two squares and lands beside yours, you may capture it **in passing** — on the next move only — as if it had moved one square.

## Challenge: pawn war!

\`\`\`chess
mode: interactive
respond: true
fen: 4k3/pppp4/8/8/8/8/PPPP4/4K3 w - - 0 1
caption: Four pawns each. Push, capture, and race to promote — the board fights back!
\`\`\`

That's the whole pawn. Small steps, diagonal bite, and a queen waiting at the finish line.`,
          order: 1,
          difficulty: 1,
          estimatedMinutes: 10,
        },
        {
          slug: 'knight-movement',
          title: 'The Knight',
          description: 'Master the unique L-shaped movement of the knight',
          content: `# The Knight

The trickster of the board: it jumps, it twists, and beginners *always* forget where it can go.

## Try the L-shape

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3N4/8/8/8/4K3 w - - 0 1
caption: Drag the knight. Two squares one way, one perpendicular — eight possible landings.
\`\`\`

## It jumps over pieces

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/2pPp3/2PNP3/2PPP3/4K3 w - - 0 1
caption: Hemmed in by pawns? Doesn't matter — the knight is the only piece that hops.
\`\`\`

## Center vs corner

A knight on **d4 or e5** reaches eight squares. A knight on **a1** reaches just two. *"A knight on the rim is dim"* — keep them in the middle.

## See the fork

\`\`\`chess
mode: animate
fen: 4q1k1/8/8/8/4N3/8/8/6K1 w - - 0 1
moves: Nf6+ Kh8 Nxe8
autoplay: true
caption: Nf6+ checks the king AND attacks the queen — a knight fork.
\`\`\`

Knights are the slow, sneaky cousins of long-range pieces. Their gift is the **fork**: two attacks at once, with nothing able to block.

## Challenge: pawn hunt

\`\`\`chess
mode: interactive
respond: true
fen: 4k3/8/2p1p3/8/3N4/8/8/4K3 w - - 0 1
caption: Hop your knight around and capture both pawns — the board defends them!
\`\`\``,
          order: 2,
          difficulty: 1,
          estimatedMinutes: 10,
        },
        {
          slug: 'bishop-movement',
          title: 'The Bishop',
          description: 'Understand diagonal movement and bishop pairs',
          content: `# The Bishop

Long-range diagonal snipers. Quiet on a blocked board, devastating in the open.

## Slide it

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3B4/8/8/8/4K3 w - - 0 1
caption: Drag the bishop — any distance, but only on diagonals.
\`\`\`

A bishop **stays on its color forever**. The d5-bishop above is a light-squared bishop, and it will only ever stand on a light square.

## Pairs are powerful

A light-squared bishop covers half the board, a dark-squared bishop covers the other half. Together, **the bishop pair** can attack every square — a long-term edge worth caring about.

## Open lines = bishop heaven

\`\`\`chess
mode: interactive
fen: 4k3/p6p/1p4p1/8/3B4/8/P1P3PP/4K3 w - - 0 1
caption: Try the bishop here — clear diagonals turn it into a monster.
\`\`\`

## Watch out for blockers

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3p4/4P3/8/8/B3K3 w - - 0 1
caption: The a1-bishop's diagonal is blocked by White's own e4-pawn. Bishops can't jump.
\`\`\`

When you trade a bishop, ask: *will my remaining bishop have open diagonals, or will my pawns block it?* Good bishops win games; bad bishops watch from the sidelines.

## Challenge: diagonal sniper

\`\`\`chess
mode: interactive
respond: true
fen: 4k3/8/1p3p2/8/3B4/8/8/4K3 w - - 0 1
caption: Both pawns sit on your bishop's color. Pick them off — the board fights back!
\`\`\``,
          order: 3,
          difficulty: 1,
          estimatedMinutes: 8,
        },
        {
          slug: 'rook-movement',
          title: 'The Rook',
          description: 'Master straight-line movement and the power of connected rooks',
          content: `# The Rook

Heavy artillery on rails — worth about five pawns and ferocious on open lines.

## Straight lines, any distance

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3R4/8/8/8/4K3 w - - 0 1
caption: Drag the rook — up, down, left, right, as far as it can see.
\`\`\`

## Open files are highways

\`\`\`chess
mode: interactive
fen: 3rk3/pp3ppp/8/8/8/8/PP3PPP/3R1K2 w - - 0 1
caption: The d-file is wide open — whoever owns it controls the position.
\`\`\`

## Find the 7th-rank rook

\`\`\`chess
mode: animate
fen: 4k3/pp3ppp/8/8/8/8/PP3PPP/3RK3 w - - 0 1
moves: Rd7
caption: Rd7 lands on the 7th rank — now your rook attacks an entire row of pawns.
\`\`\`

## Castling involves the rook

The king slides two squares toward a rook, and the rook leaps over to the king's other side. The only move where **two pieces move at once**.

A rook in the opening is shy and clumsy. A rook in the endgame, on an open file, is the boss of the board.

## Challenge: sweep the seventh

\`\`\`chess
mode: interactive
respond: true
fen: 4k3/2p2p2/8/8/8/8/8/3RK3 w - - 0 1
caption: Use ranks and files to round up Black's pawns — the board defends. Watch out for the king!
\`\`\``,
          order: 4,
          difficulty: 1,
          estimatedMinutes: 8,
        },
        {
          slug: 'queen-movement',
          title: 'The Queen',
          description: 'Command the board with the most powerful piece',
          content: `# The Queen

The most powerful piece on the board — a rook and a bishop fused into one. Worth about **nine pawns**.

## Eight directions at once

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3Q4/8/8/8/4K3 w - - 0 1
caption: Drag the queen — straight, diagonal, anywhere, any distance.
\`\`\`

## Resist the urge to attack early

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Qh5 Nc6 Bc4 g6 Qf3 Nf6
autoplay: true
caption: Watch: an early queen gets chased by ...g6 and ...Nf6 — and White wastes moves.
\`\`\`

Bring the queen out **after** your knights and bishops. Otherwise the opponent develops by harassing your most valuable piece.

## Late-game terror

\`\`\`chess
mode: interactive
fen: 6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1
caption: Once the board opens up, the queen rakes across files, ranks, and diagonals.
\`\`\`

Treat your queen like a sports car: amazing once the road is clear, but don't drive it into traffic on move three.

## Challenge: hunt the rook

\`\`\`chess
mode: interactive
respond: true
fen: 4k3/8/8/r7/8/8/8/3QK3 w - - 0 1
caption: Your queen vs a rook. Corner it, win it, then deliver mate — the board defends!
\`\`\``,
          order: 5,
          difficulty: 1,
          estimatedMinutes: 8,
        },
        {
          slug: 'king-movement',
          title: 'The King',
          description: 'Protect your king and activate it in the endgame',
          content: `# The King

The whole game revolves around this one piece. Lose it, and you lose — full stop.

## One square in any direction

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3K4/8/8/8/8 w - - 0 1
caption: Drag the king — one square, any direction.
\`\`\`

Two kings can **never** stand on adjacent squares (a king can't move next to its enemy counterpart).

## Castle early

\`\`\`chess
mode: animate
fen: rnbqk2r/ppppbppp/5n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 5
moves: O-O
caption: One move tucks the king to safety and brings a rook toward the center.
\`\`\`

In the opening, your king is a target. **Get it to the corner** behind a wall of pawns, fast.

## In the endgame, march!

\`\`\`chess
mode: interactive
fen: 8/8/8/4k3/4P3/4K3/8/8 w - - 0 1
caption: With few pieces left, the king becomes a fighter — push it toward the center.
\`\`\`

The king has two lives: a frightened civilian in the opening, a brave general in the endgame.

## Challenge: escort the pawn home

\`\`\`chess
mode: interactive
respond: true
fen: 8/8/8/4k3/8/3K4/4P3/8 w - - 0 1
caption: The classic endgame test — use your king to escort the pawn to promotion while Black's king tries to stop you.
\`\`\``,
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

**One piece. Two targets. One of them falls.** The fork is the single most common way to win material in chess.

## The classic knight fork

\`\`\`chess
mode: animate
fen: 4q1k1/8/8/8/4N3/8/8/6K1 w - - 0 1
moves: Nf6+ Kh8 Nxe8
autoplay: true
caption: Nf6+ hits the king AND the queen. The king must move — and the queen drops.
\`\`\`

Knights are the **best forkers** because nothing can block them.

## Your turn — play the fork

\`\`\`chess
mode: interactive
respond: true
fen: 4r1k1/8/8/3N4/8/8/8/6K1 w - - 0 1
caption: Find the knight move that checks the king AND attacks the rook — then collect your prize. The board plays Black!
\`\`\`

(Hint: which knight square checks the king while also covering e8?)

## Pawn forks are sneaky too

\`\`\`chess
mode: animate
fen: 4k3/8/8/2n1b3/3P4/8/8/4K3 w - - 0 1
moves: d5
caption: One little pawn push — d5 — attacks both the knight on c6 and the bishop on e6.
\`\`\`

## The hunter's checklist

1. Spot **two undefended enemy pieces**
2. Look for a square that hits both
3. **Check + attack** is the deadliest combo — the king MUST move

Once you start hunting forks, you'll see them everywhere.`,
          order: 1,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'pins',
          title: 'Pins',
          description: 'Immobilize pieces by attacking through them',
          content: `# Pins

A pin **freezes** an enemy piece — it can't move without exposing something more valuable behind it.

## See the pin

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 1
moves: Bb5 Nc6
caption: After Bb5, the knight on c6 is pinned to the king — it can't move.
\`\`\`

That's an **absolute pin**: the king is behind, so the law of chess forbids the pinned piece from moving at all.

## Pile up on the pinned piece

\`\`\`chess
mode: interactive
respond: true
fen: r1bqkbnr/ppp2ppp/2np4/1B2p3/3PP3/5N2/PPP2PPP/RNBQK2R w KQkq - 0 5
caption: The c6-knight is pinned and can't run. Attack it with your cheapest soldier — push d5! — then keep playing.
\`\`\`

Once a piece is pinned, **attack it** with more pieces than it has defenders. The pin is the immobilizer; the pile-up is the winner.

## Try a pin yourself

\`\`\`chess
mode: interactive
respond: true
fen: r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3
caption: Your move — play Bb5, pinning the knight that defends e5. Then keep playing: the board answers back!
\`\`\`

## The pin checklist

- **Absolute pin** — king behind. Pinned piece literally cannot move.
- **Relative pin** — valuable piece behind. Moving is legal but costly.
- **Long pieces only** (bishops, rooks, queens) can pin.

Look down every line that points at the enemy king or queen. Pins live there.`,
          order: 2,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'skewers',
          title: 'Skewers',
          description: 'Force a valuable piece to move and win the one behind it',
          content: `# Skewers

A pin in **reverse**: the valuable piece is in *front*. You poke it, it runs, and you grab whatever was hiding behind.

## The classic rook skewer

\`\`\`chess
mode: animate
fen: 1q6/8/8/1k6/8/8/6K1/7R w - - 0 1
moves: Rb1+ Kc5 Rxb8
autoplay: true
caption: Rb1+ checks. The king has to move — and you swallow the queen on b8.
\`\`\`

## Pin vs skewer in one picture

| Pin | Skewer |
|---|---|
| Valuable piece **behind** | Valuable piece **in front** |
| Pinned piece can't move | Front piece *must* move |
| Locks pieces in place | Forces them off |

## Your turn — play the skewer

\`\`\`chess
mode: interactive
respond: true
fen: 2q5/8/2k5/8/8/8/6K1/5R2 w - - 0 1
caption: The king and queen share the c-file. Slide your rook onto it with check — the king must step aside, and the queen is yours.
\`\`\`

(Look for the file that runs through the king and onto the queen.)

## Hunt for them

Every time you see the enemy king or queen on a long open line, ask: *"What's behind it? Can I check through to that piece?"* That's the skewer in one question.`,
          order: 3,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'discovered-attacks',
          title: 'Discovered Attacks',
          description: 'Unleash a hidden attack by moving a piece out of the way',
          content: `# Discovered Attacks

You move **one** piece — and the piece behind it suddenly attacks too. **Two attacks for the price of one move.**

## See it unmask

\`\`\`chess
mode: animate
fen: 3q2k1/5n2/8/3B4/8/8/8/3R2K1 w - - 0 1
moves: Bxf7+ Kxf7 Rxd8
caption: Bxf7+ moves the bishop AND unmasks the rook on the d-file. Take the queen next move.
\`\`\`

The bishop made its own threat (the check) while clearing a line for the rook. The opponent can only stop **one** threat.

## Discovered check is brutal

When the unmasked attacker is giving check, the opponent **must** answer the check — so the moving piece can grab anything it likes.

## Hunt for the pattern

Look for **your own piece** sitting in front of one of your rooks, bishops, or queens. If moving it makes a threat or check while opening a deadly line behind, you've found a discovered attack.

## Your turn — unleash one

\`\`\`chess
mode: interactive
respond: true
fen: r2k4/8/8/3B4/8/8/8/3RK3 w - - 0 1
caption: Your bishop blocks your own rook's check. Capture the a8-rook — the move unmasks check, so Black can't recapture!
\`\`\`

When you find one in your own games, it usually wins.`,
          order: 4,
          difficulty: 3,
          estimatedMinutes: 15,
        },
        {
          slug: 'double-attack',
          title: 'The Double Attack',
          description: 'Create two threats at once so the opponent cannot parry both',
          content: `# The Double Attack

Chess is a one-move-at-a-time game. **Two threats** in one move = opponent can answer only one = you win material.

## Queen in action

\`\`\`chess
mode: animate
fen: r5k1/6pp/8/8/8/8/5PPP/3Q2K1 w - - 0 1
moves: Qd5+ Kh8 Qxa8+
autoplay: true
caption: Qd5+ checks the king AND attacks the rook on a8. The king moves; the rook falls.
\`\`\`

## Loose pieces drop off

The most reliable double-attack target is an **undefended piece** — one with no friendly guard. Every move, scan the enemy position: are any of their pieces hanging loose?

\`\`\`chess
mode: interactive
respond: true
fen: r5k1/6pp/8/8/8/8/5PPP/3Q2K1 w - - 0 1
caption: Now YOU play it — find the queen move that checks the king AND attacks the loose a8-rook, then take it. The board defends!
\`\`\`

## Fork vs double attack

A **fork** is double attack with one piece in particular. A double attack is the broader idea: two threats, anywhere on the board, by any means.

The mantra: **"What hangs? What can hit it AND something else?"** Ask it every move.`,
          order: 5,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'removing-the-defender',
          title: 'Removing the Defender',
          description: 'Capture or chase away the piece that holds the position together',
          content: `# Removing the Defender

Some enemy pieces are safe only because **one** friend guards them. Take out the guard, and the target falls.

## Watch the defender vanish

\`\`\`chess
mode: animate
fen: 6k1/3b1ppp/5n2/8/Q7/8/1B3PPP/6K1 w - - 0 1
moves: Bxf6 gxf6 Qxd7
autoplay: true
caption: The d7-bishop is only defended by the knight on f6. Bxf6 removes the guard — then Qxd7 wins the bishop.
\`\`\`

## The mindset shift

Most players ask: *"Can I take that piece?"* Better players also ask: *"What is that piece **doing**?"* If the answer is "defending something I want," consider trading or taking the defender.

## Your turn — remove the guard

\`\`\`chess
mode: interactive
respond: true
fen: 6k1/3b1ppp/5n2/8/Q7/8/1B3PPP/6K1 w - - 0 1
caption: The d7-bishop's only guard is the f6-knight. Trade off the knight, then take the bishop — the board defends!
\`\`\`

## Three classic targets

- A pawn guarding the square in front of the king
- The lone piece holding a key central square
- The defender of a back-rank pawn shelter

Every piece has a job. Steal the worker and the work falls apart.`,
          order: 6,
          difficulty: 3,
          estimatedMinutes: 15,
        },
        {
          slug: 'deflection-decoy',
          title: 'Deflection & Decoy',
          description: 'Lure an enemy piece to the wrong square — or away from the right one',
          content: `# Deflection & Decoy

You don't always need to take a piece — sometimes you **push it where you want it**, with a threat it can't ignore.

## Deflection — push it AWAY

\`\`\`chess
mode: animate
fen: 6k1/5p1p/8/8/8/8/r5PP/R5K1 w - - 0 1
moves: Rxa2
caption: A direct trade of rooks — the same idea in miniature. Real deflections often sacrifice MORE to pull a key defender off its job.
\`\`\`

A defender pulled away can't defend. Often you give up material to deflect it — because the **follow-up** wins much more.

## Decoy — drag it TO a bad square

The mirror image: lure an enemy piece onto a square where it can be forked, pinned, or mated. Classic decoys drag the king into the open with a sacrifice.

\`\`\`chess
mode: interactive
fen: 6k1/5ppp/8/8/8/8/5PPP/R6K w - - 0 1
caption: Picture sacrificing the rook with Ra8+ — the king is forced to recapture onto a vulnerable square where your remaining attackers can pounce.
\`\`\`

## The shared trick

Both use **forcing moves** — checks, captures, big threats — to *make* an enemy piece move where it doesn't want to.

When you see a defender doing critical work, your next thought should be: *can I check or capture in a way that rips it off the job?*`,
          order: 7,
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

The king behind a wall of pawns — looks safe, *isn't*. A rook or queen on the back rank delivers checkmate, and the pawns block every escape.

## See the trap snap shut

\`\`\`chess
mode: animate
fen: 6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1
moves: Ra8#
caption: One move — Ra8 — checkmate. The pawns on f7, g7, h7 block every flight square.
\`\`\`

## Your turn — find the mate

\`\`\`chess
mode: interactive
fen: 6k1/5ppp/8/8/8/8/5PPP/2Q3K1 w - - 0 1
caption: Your move: play Qc8 — checkmate. Same trap as the rook, now with the queen. The pawns on f7, g7 and h7 do all the jailing.
\`\`\`

## Make "luft" before it's too late

A tiny pawn move — **h3** or **g3** — gives your king an escape hatch. Without it, you're one tempo from disaster.

\`\`\`chess
mode: animate
fen: 6k1/5pp1/7p/8/8/8/8/R5K1 w - - 0 1
moves: Ra8+ Kh7
caption: Now Ra8 is just check, not mate — the king escapes to h7 thanks to ...h6.
\`\`\`

## Now save yourself — make luft

\`\`\`chess
mode: interactive
respond: true
fen: 4r1k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1
caption: Your move: Black's rook is already staring down your back rank. Play h3 to open an escape hatch before it crashes in — then keep going, the board answers back.
\`\`\`

**Always check your back rank.** It's the #1 way casual games end in disaster.`,
          order: 1,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'two-rook-mate',
          title: 'Two-Rook Checkmate',
          description: 'The "lawnmower" mate that drives the king off the board',
          content: `# Two-Rook Checkmate

The **ladder mate** (or "lawnmower") — two rooks marching the lonely king to the edge of the board.

## Watch them climb

\`\`\`chess
mode: animate
fen: 4k3/8/8/8/8/8/R7/1R5K w - - 0 1
moves: Ra7 Kd8 Rb8#
autoplay: true
caption: One rook seals the 7th rank. The other checks on the 8th — mate.
\`\`\`

## The recipe

1. **Trap the king on a rank** with one rook (cutting off retreat)
2. **Check with the other rook** one rank further, forcing the king back
3. **Climb the ladder** — alternate rooks, one rank at a time
4. Mate on the edge

## Your turn — climb the ladder

\`\`\`chess
mode: interactive
respond: true
fen: 8/R7/8/3k4/8/8/1R6/7K w - - 0 1
caption: Your move: check with a rook to push the king back a rank, then alternate rooks to climb. The board runs the king — if it ever marches at a rook, slide that rook FAR down its rank so it can never be captured.
\`\`\`

That's the whole technique. It's the cleanest mate in chess — practice it once and you'll never lose a K+2R vs K endgame.`,
          order: 2,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'queen-king-mate',
          title: 'Queen and King Checkmate',
          description: 'Corner the lone king with your queen and king working together',
          content: `# Queen and King Checkmate

K+Q vs K is a forced mate in under ten moves — **if** you avoid stalemate.

## See the finish

\`\`\`chess
mode: animate
fen: 4k3/8/3K4/8/8/8/8/4Q3 w - - 0 1
moves: Qe7#
caption: White king on d6 covers d7, e7, f7. Black king has nowhere to go. Mate.
\`\`\`

## The plan in three steps

1. **Fence** the enemy king with your queen, staying a knight's-move away (so it can't capture)
2. **Walk your king up** — the queen alone can never mate
3. **Mate on the edge** with the king guarding the queen

## Beware stalemate!

\`\`\`chess
mode: interactive
fen: 7k/8/6K1/8/8/8/8/5Q2 w - - 0 1
caption: Trap: Qf7?? leaves Black with no legal move but no check — STALEMATE, a draw. Always leave the king a square until the killing blow.
\`\`\`

## Your turn — box the king in

\`\`\`chess
mode: interactive
respond: true
fen: 4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1
caption: Your move: practice the whole win. Fence the king a knight's-move away with the queen, march your king up to help, then mate on the edge — without ever stalemating. The board defends!
\`\`\`

The rule of thumb: **king first, queen second**. If you're tempted to deliver mate but your king isn't close enough, take another move to walk it up.`,
          order: 3,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'smothered-mate',
          title: 'Smothered Mate',
          description: 'The knight delivers mate while the king is trapped by its own pieces',
          content: `# Smothered Mate

The most beautiful pattern in chess: the king **buried alive** by its own pieces, finished off by a single knight.

## See the burial

\`\`\`chess
mode: animate
fen: 6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1
moves: Nf7#
caption: Nf7 — check. The king can't escape (own rook on g8, own pawns on g7/h7). Mate.
\`\`\`

## Why the knight is the only piece that can do this

Every other check (rook, bishop, queen) can be blocked. **A knight check cannot be blocked.** So when every escape square is filled by friendly pieces, even one knight check ends the game.

## Your turn — mate in one

\`\`\`chess
mode: interactive
fen: 6rk/6pp/3N4/8/8/8/8/6K1 w - - 0 1
caption: Your move: the king on h8 is buried by its own rook and pawns. Jump the knight to f7 — a check that can't be blocked and can't be escaped. Mate!
\`\`\`

The full Philidor's Legacy combination — Nf7+ Kh8, Nxh6+? No: queen sacrifice on g8 first, *then* the knight returns — is one of the most famous tactics in chess history.`,
          order: 4,
          difficulty: 3,
          estimatedMinutes: 12,
        },
        {
          slug: 'scholars-mate',
          title: "Scholar's Mate",
          description: 'The four-move mate beginners love — and how to stop it',
          content: `# Scholar's Mate

The most famous trap in chess — **four moves and you're dead**, all because f7 is defended only by the king.

## Watch it land

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Bc4 Nc6 Qh5 Nf6 Qxf7#
autoplay: true
caption: Queen and bishop both eye f7. ...Nf6?? defends nothing, and Qxf7 is mate.
\`\`\`

## Defend it three ways

\`\`\`chess
mode: animate
fen: r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3
moves: g6
caption: ...g6! chases the queen and defends f7 in one move. The best reply.
\`\`\`

You can also play **...Qe7** (guards f7) or **...Qf6** — both stop mate immediately.

## Your turn — defend as Black

\`\`\`chess
mode: interactive
respond: true
flip: true
fen: r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3
caption: You're Black, and Qxf7# is threatened. Play g6 to attack the queen and guard f7 in one move — the mate threat vanishes. The board plays White, so keep going and harass that queen.
\`\`\`

## The real lesson

Beginners hope for Scholar's Mate. Anyone who knows it shrugs it off and **harasses the queen** for the next ten moves, leaving the attacker behind in development.

Don't try to win by move four. Watch your **f2** and **f7** squares — they're the weakest in the opening.`,
          order: 5,
          difficulty: 1,
          estimatedMinutes: 12,
        },
        {
          slug: 'arabian-mate',
          title: 'Arabian Mate',
          description: 'A knight and rook combine to trap the king in the corner',
          content: `# Arabian Mate

One of the **oldest** patterns in chess — a knight and rook combining like clockwork against a cornered king.

## The cage closes

\`\`\`chess
mode: animate
fen: 7k/R7/5N2/8/8/8/8/K7 w - - 0 1
moves: Rh7#
caption: Rh7 — mate. The knight on f6 guards g8 (no escape) AND defends the rook on h7 (no capture).
\`\`\`

## The geometry, once and forever

- King in the corner (h8)
- Knight on **f6** — covers g8 + defends the rook
- Rook on **h7** — checks along the h-file + covers g7

That's the Arabian. Once you know the shape, you'll spot mate-in-one chances in dozens of endgames.

## Your turn — finish the Arabian

\`\`\`chess
mode: interactive
fen: 7k/8/5N2/8/8/8/8/K6R w - - 0 1
caption: Your move: the knight on f6 already covers g8 and h7. Swing the rook to h7 — check down the h-file, and every escape is sealed. Mate in one!
\`\`\`

(The rook is untouchable on h7 because the f6-knight defends it — that's the whole Arabian trick.)`,
          order: 6,
          difficulty: 3,
          estimatedMinutes: 12,
        },
      ],
    },

    {
      slug: 'special-moves',
      title: 'Rules & Special Moves',
      description: 'Castling, en passant, promotion, and how games are drawn',
      level: 'beginner',
      order: 4,
      icon: 'Sparkles',
      lessons: [
        {
          slug: 'castling',
          title: 'Castling',
          description: 'The only move where the king and a rook move together',
          content: `# Castling

The **only move where two pieces move at once** — and the fastest way to make your king safe.

## Castle kingside

\`\`\`chess
mode: animate
fen: rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 5
moves: O-O O-O
autoplay: true
caption: Two short moves — O-O for both sides. King in the corner, rook on f1/f8, opening done.
\`\`\`

## Try it yourself

\`\`\`chess
mode: interactive
respond: true
fen: rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 1 5
caption: Your move: castle kingside (O-O) by dragging the king two squares to the right — the rook jumps over automatically. The board plays on!
\`\`\`

## The five rules of castling

1. King hasn't moved ✓
2. That rook hasn't moved ✓
3. Squares between are empty ✓
4. King isn't in check right now ✓
5. King doesn't pass through (or land on) an attacked square ✓

## Now try queenside

\`\`\`chess
mode: interactive
fen: r3k2r/pppq1ppp/2npbn2/4p3/4P3/2NPBN2/PPPQ1PPP/R3K2R w KQkq - 0 1
caption: Your move: castle queenside (O-O-O) by dragging the king two squares to the LEFT, toward the a-rook. Notice the king still moves exactly two squares — the rook travels farther.
\`\`\`

## Kingside vs queenside

| O-O (kingside) | O-O-O (queenside) |
|---|---|
| Fast, simple, safer | Brings a-rook into action |
| 2-square king move | 3-square king move |
| Most common | Sharp, attacking |

**When in doubt, castle.** A king in the center is a king in trouble.`,
          order: 1,
          difficulty: 1,
          estimatedMinutes: 10,
        },
        {
          slug: 'en-passant',
          title: 'En Passant',
          description: 'The special pawn capture that surprises every beginner',
          content: `# En Passant

The weirdest, most misunderstood rule in chess. **Read it once, then try it.**

## See it happen

\`\`\`chess
mode: animate
fen: 4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1
moves: exd6
caption: Black just played ...d7-d5, skipping past your e5-pawn. You capture "in passing" — exd6 — landing on d6, removing the d5-pawn.
\`\`\`

Yes, your pawn lands on an **empty** square (d6) and removes a pawn from a **different** square (d5). That's the magic.

## Your turn — capture en passant

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1
caption: Your move: Black's pawn just leaped from d7 to d5, right past your e5-pawn. Grab it "in passing" — play exd6, landing on the empty d6 square and removing the d5-pawn.
\`\`\`

## The three rules to remember

1. The enemy pawn must move **two squares** (not one)
2. It must land **right beside** your pawn
3. You must capture **immediately** — on your very next move, or the chance is gone forever

## Why this rule exists

Without it, pawns could sneak past each other using their two-square jump. En passant restores fairness: your pawn still gets to attack as if the enemy had moved one square.`,
          order: 2,
          difficulty: 2,
          estimatedMinutes: 10,
        },
        {
          slug: 'pawn-promotion',
          title: 'Pawn Promotion',
          description: 'Turn a humble pawn into a queen — or something cleverer',
          content: `# Pawn Promotion

A pawn that reaches the end of the board **transforms** — into a queen, rook, bishop, or knight. (Never a king. Never a pawn.)

## Watch the transformation

\`\`\`chess
mode: animate
fen: 4k3/P7/8/8/8/8/8/4K3 w - - 0 1
moves: a8=Q
caption: One push, one new queen. A pawn became your most powerful piece.
\`\`\`

## Do it yourself

\`\`\`chess
mode: interactive
fen: 4k3/4P3/8/8/8/8/8/4K3 w - - 0 1
caption: Your move: push the e-pawn to e8 — it becomes a queen the instant it lands. (You may promote even if you already have a queen.)
\`\`\`

## Underpromotion — choosing NOT a queen

Sometimes the queen is wrong. **Underpromote to a knight** when only a knight can give a key check or fork. **Underpromote to a rook** when promoting to a queen would stalemate the enemy king.

\`\`\`chess
mode: animate
fen: 8/1q1P1k2/8/8/8/8/8/4K3 w - - 0 1
moves: d8=N+ Kf6 Nxb7
autoplay: true
caption: d8=N+ — underpromote to a knight! It checks the king on f7 AND forks the queen on b7. A new queen on d8 wouldn't even give check. The king must run, then Nxb7 collects the queen.
\`\`\`

## The pawn that *will* promote = the pawn that decides

A **passed pawn** (no enemy pawn can stop it) is worth a fortune in the endgame. Every move you make in a pawn endgame should ask: *whose pawn promotes first?*`,
          order: 3,
          difficulty: 1,
          estimatedMinutes: 10,
        },
        {
          slug: 'draws-and-stalemate',
          title: 'Draws & Stalemate',
          description: 'The five ways a chess game can end in a draw',
          content: `# Draws & Stalemate

Not every game ends in mate. **Five ways** a game can end in a draw — and one of them will sabotage a winning position if you're not careful.

## The killer: stalemate

\`\`\`chess
mode: animate
fen: 7k/8/6K1/8/8/8/8/5Q2 w - - 0 1
moves: Qf7
caption: Disaster! Qf7?? — Black has no legal move and is NOT in check. Stalemate. Draw.
\`\`\`

**Stalemate** = player to move has no legal moves AND is not in check. The game is an instant draw. It's the most heartbreaking way to throw away a won game.

## Find the safe move

\`\`\`chess
mode: interactive
respond: true
fen: 7k/8/6K1/8/8/8/8/5Q2 w - - 0 1
caption: Your move: play Qf6 instead of Qf7. It checks, and Black can still answer with ...Kg8 — so it's not stalemate. The board replies; now use your king to finish without ever taking away that last square.
\`\`\`

## The other four draws

| Rule | When |
|---|---|
| Threefold repetition | Same position appears 3 times |
| Fifty-move rule | 50 moves by each side without capture or pawn move |
| Insufficient material | K vs K, K+B vs K, K+N vs K — no one can mate |
| Agreement | Both players say "draw?" "draw." |

## Survival tip

**Losing? Hunt for stalemate.** Trap your king in a corner so the opponent runs out of safe checks. Many "lost" games are saved this way.`,
          order: 4,
          difficulty: 2,
          estimatedMinutes: 12,
        },
      ],
    },
    {
      slug: 'chess-notation',
      title: 'Reading Chess Notation',
      description: 'Learn to read and write moves in algebraic notation',
      level: 'beginner',
      order: 5,
      icon: 'PenLine',
      lessons: [
        {
          slug: 'algebraic-notation',
          title: 'Algebraic Notation',
          description: 'The universal language for recording chess moves',
          content: `# Algebraic Notation

The universal language of chess. Once you know it, you can read **any** book, watch **any** stream, and review **any** game.

## Every square has a name

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/3N4/8/8/4K3 w - - 0 1
caption: Files (columns) run a–h left to right; ranks (rows) run 1–8 bottom to top. The knight sits on d4 — file d, rank 4. Drag any piece and watch its destination squares light up; every one has a name like that.
\`\`\`

## Your move — write a move

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/8/5N2/8/4K3 w - - 0 1
caption: Your move: drag the knight to e5. You just played "Ne5" — the piece letter (N for knight) followed by the destination square.
\`\`\`

## Your move — record a capture

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/3p4/5N2/8/4K3 w - - 0 1
caption: Your move: capture the pawn by dragging the knight onto d4. That move is written "Nxd4" — the x means "captures".
\`\`\`

## Your move — castle, and name it

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/8/8/8/4K2R w K - 0 1
caption: Your move: castle kingside by dragging the king two squares to the right. In notation that's "O-O" (queenside would be "O-O-O").
\`\`\`

## The piece letters

| Piece | Letter |
|---|---|
| King | K |
| Queen | Q |
| Rook | R |
| Bishop | B |
| Knight | N |
| Pawn | *(none — just the square, e.g. "e4")* |

## The rest of the symbols

- **Capture:** Bxe5 — the bishop takes on e5
- **Check:** + as in Nf6+, and **mate:** # as in Qxf7#
- **Castle:** O-O (short) or O-O-O (long)
- **Promote:** e8=Q — a pawn becomes a queen
- **Annotations:** ! good, ? bad, !! brilliant, ?? blunder

## Read a real game

\`\`\`chess
mode: animate
moves: e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6
autoplay: true
caption: 1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 dxc6 — the Ruy Lopez Exchange. Watch Bxc6 (bishop captures) and dxc6 (the d-pawn recaptures). You just read a real game!
\`\`\`

Now you can read the moves above any board. Welcome to the club.`,
          order: 1,
          difficulty: 1,
          estimatedMinutes: 10,
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

The four squares **d4, d5, e4, e5** are the most important real estate on the board. Whoever owns them dominates the game.

## Why the center?

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/4N3/8/8/4K3 w - - 0 1
caption: Click the e4-knight — it reaches 8 squares. Now imagine it in the corner: only 2. The center multiplies every piece's power. Drag it around and see for yourself.
\`\`\`

## Your move — take the center

\`\`\`chess
mode: interactive
respond: true
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
caption: Your move: stake your flag in the middle — push a pawn to e4 (or d4). The board answers back, and the fight for the center is on.
\`\`\`

## Classical: occupy it with pawns

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 d4 exd4 Nf3
autoplay: true
caption: Pawns on d4 + e4 stake a flag in the center; pieces support and reclaim.
\`\`\`

## Hypermodern: attack it from afar

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: Nf3 Nf6 g3 g6 Bg2 Bg7
autoplay: true
caption: Don't occupy — control. The fianchettoed bishops on g2/g7 rake the center from the wings.
\`\`\`

## In one sentence

**Fight for the center every move.** Either by putting a pawn there or by attacking it with a piece. Players who control d4/d5/e4/e5 win games.`,
          order: 1,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'develop-pieces',
          title: 'Develop Your Pieces',
          description: 'Get your knights and bishops into the game quickly',
          content: `# Develop Your Pieces

The opening race has one rule: **get your pieces off the back rank before your opponent does.**

## A textbook opening

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bc4 Bc5 O-O Nf6
autoplay: true
caption: Knight, knight, bishop, bishop, castle. Eight moves, total development.
\`\`\`

## The four golden rules

1. **Knights before bishops** — knights have fewer good squares; commit them first
2. **One move per piece** in the opening (unless you have a reason)
3. **Don't bring the queen out early** — see the next lesson
4. **Castle by move 10** — usually by move 7

## Your move — develop a knight

\`\`\`chess
mode: interactive
respond: true
fen: rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2
caption: Your move: obey rule #1 — knights before bishops. Develop your kingside knight to f3, attacking the e5-pawn as you go. The board answers back; keep developing.
\`\`\`

## Spot the bad opening

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Bc4 Bc5 Nf3 Nc6 Bxf7+ Kxf7 Ng5+
autoplay: true
caption: Watch White waste pieces on tricks instead of developing. Don't be this player.
\`\`\`

## Tempo is everything

Every move you spend NOT developing is a move your opponent uses to get ahead. **Count your tempi**: how many pieces have I developed vs. my opponent? If you're behind by two, you're losing.`,
          order: 2,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'king-safety',
          title: 'King Safety and Castling',
          description: 'Tuck your king away before launching into the middlegame',
          content: `# King Safety & Castling

A king in the center is a king in danger. **Castle by move 10** — it's the most important rule in the opening.

## Why a centralized king dies

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1
moves: f4 exf4 Nf3 g5 Bc4 g4 O-O
autoplay: true
caption: White castles just in time. An uncastled king in the center? Disaster waits.
\`\`\`

## Try it — castle quickly

\`\`\`chess
mode: interactive
respond: true
fen: rnbqkbnr/pppp1ppp/8/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 2 3
caption: Your move: everything's ready — drag the king two squares to the right (O-O) and tuck it safely behind the pawns. The board plays on.
\`\`\`

## Keep your pawn shield intact

\`\`\`chess
mode: interactive
fen: r1bq1rk1/ppp1nppp/2n5/3pp3/3P4/2P1PN2/PP3PPP/RNBQ1RK1 w - - 0 1
caption: f-, g-, h-pawns in front of the king = shelter. Don't push them without a very good reason.
\`\`\`

## Kingside vs queenside

| O-O (short) | O-O-O (long) |
|---|---|
| Safer, simpler | More aggressive |
| Most common | Activates a-rook fast |
| Pick this 90% of the time | Pick this for sharp attacks |

The chess saying: *"Castle if you can, when you can."*`,
          order: 3,
          difficulty: 2,
          estimatedMinutes: 15,
        },
        {
          slug: 'queen-too-early',
          title: "Don't Bring the Queen Out Too Early",
          description: 'Why an early queen sortie hands your opponent free development',
          content: `# Don't Bring the Queen Out Too Early

The queen is your strongest piece — and your most valuable target. Move it before your other pieces and you'll **lose move after move** running away from it.

## Watch the disaster unfold

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Qh5 Nc6 Bc4 g6 Qf3 Nf6
autoplay: true
caption: White moves the queen TWICE in the first four moves. Black develops with tempo — each move attacks the queen AND develops a piece.
\`\`\`

## The math of tempo

By move 4, White has moved one piece three times. Black has developed three different pieces. **White is three tempi behind.** Black plays the opening for free.

## Your move — punish the early queen

\`\`\`chess
mode: interactive
respond: true
flip: true
fen: rnbqkbnr/pppp1ppp/8/4p2Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 1 2
caption: You're Black. White just played 2.Qh5?! — don't panic, just develop. Play Nc6: it brings out a piece AND defends e5. The queen has achieved nothing, and you'll gain time chasing it. The board plays White.
\`\`\`

## The right way

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+
autoplay: true
caption: White develops everything first. The queen stays home until there's a safe, active square for it.
\`\`\`

## The principle, simply

**Knights → Bishops → Castle → Queen.** Wait your turn, queen.

(There are exceptions — the Scandinavian's ...Qxd5 is famous — but as a beginner, follow the rule.)`,
          order: 4,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'opening-traps',
          title: 'Common Opening Traps',
          description: 'Recognize the quick tricks that catch unprepared players',
          content: `# Common Opening Traps

A trap is a move that **looks** like a mistake — but if the opponent grabs the bait, they lose. Learn the famous ones so you can spring them (and never fall in).

## The Fried Liver — punishing a greedy knight

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Nxd5 Nxf7
autoplay: true
caption: 6.Nxf7!? — the Fried Liver. White sacrifices a knight to drag the king out for a brutal attack.
\`\`\`

## The Englund Gambit Trap — Black mates White

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2 Bc3 Bb4
autoplay: true
caption: Englund Gambit Trap — White grabs every offered pawn and walks into ...Bxc3+ and material loss.
\`\`\`

## How to NEVER fall into a trap

1. **Develop soundly** — most traps punish neglected development or greed
2. Before grabbing a free pawn, ask: *"Why is this being offered?"*
3. Watch your **f2 / f7** square and your back rank
4. If something looks too good to be true in the opening, **look twice**

## Your move — spring the Fried Liver

\`\`\`chess
mode: interactive
respond: true
fen: r1bqkb1r/ppp2ppp/2n5/3np1N1/2B5/8/PPPP1PPP/RNBQK2R w KQkq - 0 6
caption: Your move: this is the moment. Play Nxf7 — sacrificing the knight to drag the Black king into the open for a raging attack. The board answers back; hunt that king.
\`\`\`

Solid development beats every trap — but when the chance appears, take it. Always.`,
          order: 5,
          difficulty: 3,
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

The most important endgame in chess. Get it wrong and **a winning pawn** turns into a draw.

## See the win

\`\`\`chess
mode: animate
fen: 4k3/8/8/8/8/8/4P3/4K3 w - - 0 1
moves: e4 Kd7 Ke2 Ke6 Ke3 Ke5
autoplay: true
caption: Walk the king forward to support its pawn. Then push together — the king clears the path.
\`\`\`

## Your move — win the race (Rule of the Square)

\`\`\`chess
mode: interactive
respond: true
fen: 8/8/8/8/k7/8/4P3/4K3 w - - 0 1
caption: Your move: picture the square from the e2-pawn up to e8. The Black king is OUTSIDE it, so it can never catch up — just run! Push the pawn to promotion while the board chases in vain.
\`\`\`

## Opposition — the silent king duel

\`\`\`chess
mode: interactive
fen: 4k3/8/4K3/8/4P3/8/8/8 b - - 0 1
caption: Kings facing off with one square between = opposition. Black is to move and must give way. White will promote.
\`\`\`

## The two rules to memorize

1. **King in front of the pawn** beats king behind it
2. **The player NOT to move** has the opposition

Master these and you'll win every K+P vs K endgame from a winning position.`,
          order: 1,
          difficulty: 3,
          estimatedMinutes: 20,
        },
        {
          slug: 'rook-endgames',
          title: 'Rook Endgames',
          description: 'The most common endgame — learn the key drawing and winning ideas',
          content: `# Rook Endgames

The **most common** endgame in chess. Knowing the basics will save you half-points every week.

## Rooks belong behind passed pawns

\`\`\`chess
mode: interactive
fen: 8/8/3k4/3P4/8/8/r7/3RK3 w - - 0 1
caption: The famous Tarrasch rule: rooks BEHIND passed pawns (yours or theirs). Here Black's rook is correctly behind White's pawn.
\`\`\`

## Your move — put the rook to work

\`\`\`chess
mode: interactive
respond: true
fen: 6k1/p4p1p/6p1/8/8/2R5/PP4PP/6K1 w - - 0 1
caption: Your move: your rook is FREE — send it to the 7th rank with Rc7, hitting a7 and f7 at once. An active rook is worth a pawn; a passive one loses. The board answers back.
\`\`\`

## Cut off the enemy king

\`\`\`chess
mode: animate
fen: 4k3/8/8/8/8/8/4P3/R3K3 w - - 0 1
moves: Ra5
caption: Ra5 puts the rook on the 5th rank, cutting off the enemy king from advancing. Now your pawn is safe to march.
\`\`\`

## The two positions to know

1. **Lucena** — fundamental WIN with rook + pawn vs rook (see Advanced Endgames)
2. **Philidor** — fundamental DRAW with just a rook (see Advanced Endgames)

## Rules of thumb

- Rooks behind passed pawns
- Keep your rook **active**
- Cut off the enemy king
- An open rook on the 7th rank is worth fighting for

Rook endings are the bread and butter of practical chess. Spend an hour on them and you'll climb 100 rating points.`,
          order: 2,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'the-opposition',
          title: 'The Opposition',
          description: 'The king battle that decides countless pawn endgames',
          content: `# The Opposition

The most important silent battle in chess: two kings facing off, **forcing each other to give way**.

## What it looks like

\`\`\`chess
mode: interactive
fen: 4k3/8/4K3/8/8/8/8/8 b - - 0 1
caption: Direct opposition: kings on same file, one square apart. Black is to move and MUST step aside — White wins the duel.
\`\`\`

The rule: **whoever does NOT have to move has the opposition.**

## Distant opposition

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/8/8/8/4K3 b - - 0 1
caption: Kings on same file, an ODD number of squares apart (here 7). Same battle, fought from afar.
\`\`\`

## Why it decides games

In king-and-pawn endgames, the side with the opposition can **push the enemy king backward** — clearing a path for the pawn to promote. Lose the opposition and a winning position turns into a draw.

## The practical recipe

\`\`\`chess
mode: animate
fen: 8/3k4/8/3K4/3P4/8/8/8 b - - 0 1
moves: Kd8 Kc6 Kc8 d5
autoplay: true
caption: White has the opposition. Black must give way. White's king escorts the d-pawn forward.
\`\`\`

## Your move — win the duel yourself

\`\`\`chess
mode: interactive
respond: true
fen: 3k4/8/8/3K4/3P4/8/8/8 w - - 0 1
caption: Your move: seize the opposition with Kd6 — kings face to face, one square apart, and Black must give ground. Then escort the pawn home. The board defends its best.
\`\`\`

Opposition is the chess version of a staring contest — and yes, you can win or lose entire games on it.`,
          order: 3,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'passed-pawns',
          title: 'Passed Pawns',
          description: 'The runaway pawns that decide endgames',
          content: `# Passed Pawns

A pawn with **no enemy pawns blocking it** on its file or the two files next to it. Nothing can stop it from promoting except enemy pieces.

## Watch it crown

\`\`\`chess
mode: animate
fen: 8/2P5/8/8/8/8/k7/2K5 w - - 0 1
moves: c8=Q
autoplay: true
caption: One step. One new queen. Passed pawns are unstoppable.
\`\`\`

## "Passed pawns must be pushed!"

\`\`\`chess
mode: interactive
respond: true
fen: 8/8/8/8/4P3/8/k7/4K3 w - - 0 1
caption: Your move — push the pawn, and keep pushing. Don't wait, don't defend, don't dawdle. The board chases; escort your passer all the way to e8 and promote.
\`\`\`

## A protected passed pawn is a fortress

\`\`\`chess
mode: interactive
fen: 8/8/3P4/4P3/8/8/k7/4K3 w - - 0 1
caption: The d6-pawn is passed AND protected by the e5-pawn. Almost unstoppable.
\`\`\`

## The outside passer

A passed pawn on the **a or h file** is a winning weapon: it lures the enemy king to the wrong corner while yours feasts on the other side.

## Your move — the Rule of the Square

\`\`\`chess
mode: interactive
fen: 8/4P3/8/8/k7/8/8/4K3 w - - 0 1
caption: Your move: the Black king is OUTSIDE the square of the e7-pawn (e7-e8-b8 and back), so it can't catch up. Prove it — promote with e8=Q.
\`\`\`

A passed pawn is hope incarnate. **Push it.**`,
          order: 4,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'two-bishop-mate',
          title: 'Two-Bishop Checkmate',
          description: 'Force mate in the corner with the bishop pair and your king',
          content: `# Two-Bishop Checkmate

K + 2 bishops vs lone king is a **forced win**. The bishops sweep parallel diagonals and the king herds the prey into a corner.

## See the kill

\`\`\`chess
mode: animate
fen: 7k/8/6K1/3B4/8/8/8/2B5 w - - 0 1
moves: Bb2#
caption: Two bishops on parallel diagonals + your king nearby = mate. Bb2 finishes the job.
\`\`\`

## Three things to remember

1. **Any corner works** (unlike B+N mate where only specific corners do)
2. **Bishops side-by-side** form a moving wall the king can't cross
3. **Your king herds**, the bishops cut

## Your move — squeeze it to the corner

\`\`\`chess
mode: interactive
respond: true
fen: 6k1/8/6K1/8/3BB3/8/8/8 w - - 0 1
caption: Your move: your bishops sit side by side on d4 and e4 — a moving wall on two colours. Slide them to herd the king toward h8. The board runs the king; keep squeezing, but leave it one square until you're ready to mate (don't stalemate!).
\`\`\`

## Avoid stalemate

As the king nears the corner, **leave it one square** until you're ready to deliver mate. Pushing one move too soon turns a win into a draw.

This mate is rare in practice, but knowing it teaches you how to coordinate pieces — a skill that pays off in every endgame.`,
          order: 5,
          difficulty: 4,
          estimatedMinutes: 20,
        },
      ],
    },

    {
      slug: 'middlegame-strategy',
      title: 'Middlegame Strategy',
      description: 'Positional ideas that guide your plans after the opening',
      level: 'intermediate',
      order: 3,
      icon: 'Brain',
      lessons: [
        {
          slug: 'pawn-structure',
          title: 'Pawn Structure',
          description: 'Pawns are the skeleton of the position — learn to read them',
          content: `# Pawn Structure

Pawns **can't go back**. Every push is permanent. That's why pawn structure is the most lasting feature of any position.

## Spot the isolated pawn

\`\`\`chess
mode: interactive
fen: 4k3/p1p2p1p/8/3p4/3P4/8/P1P2P1P/4K3 w - - 0 1
caption: Both d-pawns are ISOLATED — no friendly pawn on c or e to defend them. They're long-term weaknesses.
\`\`\`

## Doubled pawns

\`\`\`chess
mode: interactive
fen: 4k3/pp3ppp/2p5/8/8/2P5/PP3PPP/4K3 w - - 0 1
caption: Two c-pawns stacked = doubled pawns. They can't defend each other and often become targets.
\`\`\`

## The pawn chain — attack the BASE

\`\`\`chess
mode: interactive
fen: 4k3/pp3ppp/8/4p3/3pP3/3P4/PPP3PP/4K3 w - - 0 1
caption: Two locked chains. Each chain's BASE is its rear pawn: White's d3 props up e4; Black's e5 props up d4. To break a chain, strike its base — e.g., White plays f4 to hit e5.
\`\`\`

## The big idea

Each pawn move leaves a permanent hole behind it. Before you push, ask:
- *Does this improve my structure?*
- *Or does it weaken a key square?*

**Pieces come and go. Pawn weaknesses last forever.**`,
          order: 1,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'open-files-and-rooks',
          title: 'Open Files & Rook Power',
          description: 'Put your rooks where they dominate — on open lines',
          content: `# Open Files & Rook Power

Rooks are clumsy in the opening but **monsters** once lines open. Their natural habitat is the open file.

## Open vs half-open vs closed

\`\`\`chess
mode: interactive
fen: 3r2k1/pp3ppp/8/8/8/8/PP3PPP/3R2K1 w - - 0 1
caption: D-file: OPEN (no pawns) — both sides race for it. Whoever owns it owns the board.
\`\`\`

## Double your rooks

\`\`\`chess
mode: interactive
fen: 6k1/pp3ppp/8/8/8/8/PP3PPP/3R1RK1 w - - 0 1
caption: Pile two rooks on the same file (e.g., Rd2 then Rfd1) — pressure multiplies.
\`\`\`

## Your move — invade the 7th rank

\`\`\`chess
mode: interactive
respond: true
fen: 4k3/pp3ppp/8/8/8/8/PP3PPP/3RK3 w - - 0 1
caption: Your move: the d-file is wide open — slam the rook down to d7, the absolute 7th rank. It rakes Black's pawns and pins the king to the back. Often worth a whole pawn. The board answers back.
\`\`\`

## The three rook rules

1. **Open files first** — race your opponent
2. **Double up** on key files
3. **Seventh rank** is paradise

The opening positions rooks; the middlegame rewards the player who gets them onto open lines first.`,
          order: 2,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'outposts',
          title: 'Outposts',
          description: 'Plant a knight on a protected square deep in enemy territory',
          content: `# Outposts

A **square deep in enemy territory** that no enemy pawn can attack, protected by one of yours. Park a knight there and it's a monster.

## The dream outpost

\`\`\`chess
mode: interactive
fen: r2q1rk1/pp3ppp/2n1p3/2Np4/3P4/2P5/PP3PPP/R2Q1RK1 w - - 0 1
caption: The knight on c5 is OUTPOSTED. No black pawn can ever drive it away. Trade it? Black loses a much better piece.
\`\`\`

## What makes an outpost "good"

| ✓ Good | ✗ Bad |
|---|---|
| Square can't be hit by a pawn | Pawn can drive the knight away |
| Defended by your own pawn | Hangs to a simple capture |
| 4th–6th rank in enemy half | Stuck on your own side |

## Your move — occupy the outpost

\`\`\`chess
mode: interactive
respond: true
fen: r1bq1rk1/ppp2ppp/2nb1n2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQ - 0 1
caption: Your move: e5 is a hole — supported by your d4-pawn and out of reach of Black's pawns. Leap the knight to e5 and clamp down. The board answers back.
\`\`\`

## Knights love outposts most

Bishops, rooks, even queens enjoy them — but the **short-legged knight** becomes a different piece on an advanced outpost. It's the classic positional trophy.

When you weaken a square in your own camp, you give your opponent an outpost — usually forever. So push pawns carefully.`,
          order: 3,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'good-and-bad-bishops',
          title: 'Good & Bad Bishops',
          description: 'Why some bishops shine and others bite on granite',
          content: `# Good & Bad Bishops

Your bishop is only as good as the diagonals it can use. **Pawn structure** decides whether it's a hero or a spectator.

## Spot the bad bishop

\`\`\`chess
mode: interactive
fen: 4k3/1ppp1ppp/8/8/8/8/1PPPBPPP/4K3 w - - 0 1
caption: White's bishop is on a LIGHT square. Look at the white pawns — almost all on LIGHT squares too. The bishop is BAD — blocked by its own pawns.
\`\`\`

## Spot the good bishop

\`\`\`chess
mode: interactive
fen: 4k3/1pp2ppp/3p4/8/8/3P4/1PP2PPP/3BK3 w - - 0 1
caption: Same bishop, different pawns — White's pawns are mostly on DARK squares now, leaving the bishop's diagonals free. GOOD bishop.
\`\`\`

## The rule

**Put your pawns on the OPPOSITE color of your remaining bishop.**
- Dark-squared bishop? Pawns on light squares.
- Light-squared bishop? Pawns on dark squares.

## The bishop pair

\`\`\`chess
mode: interactive
fen: r3k2r/pppq1ppp/2n2n2/3p4/3P4/2P2N2/PPQ2PPP/R3KB1R w KQkq - 0 1
caption: White has both bishops (b1, f1); Black gave one up. Together White's pair covers EVERY square — a lasting edge in open positions.
\`\`\`

Before trading a bishop for a knight, ask: *"Will my remaining bishop be good or bad given the pawn structure to come?"*`,
          order: 4,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'space-advantage',
          title: 'Space Advantage',
          description: 'Use advanced pawns to cramp your opponent and maneuver freely',
          content: `# Space Advantage

**Space** = the rows behind your advanced pawns. More space = more room for your pieces to maneuver while the opponent stumbles over their own.

## See the space edge

\`\`\`chess
mode: interactive
fen: r1bqkb1r/pp1n1ppp/2p1pn2/3pP3/2PP4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 1
caption: White's pawns on c4/d4/e5 grab the whole 4th and 5th ranks. White has SPACE; Black is cramped.
\`\`\`

## Two rules for the side with more space

1. **Don't trade pieces** — trades relieve the cramped side
2. **Switch wings fast** — your pieces move freely behind the lines, the opponent's pieces collide

\`\`\`chess
mode: animate
fen: r1bqkb1r/pp1n1ppp/2p1pn2/3pP3/2PP4/2N2N2/PP3PPP/R1BQKB1R w KQkq - 0 1
moves: Bd3 Be7 O-O O-O h3 Re8 Re1
autoplay: true
caption: White calmly develops, refusing trades. Black's pieces have nowhere good to go.
\`\`\`

## Counterplay for the cramped side

- **Trade pieces** at every chance
- **Strike the pawn chain** at its base (...c5 or ...f6) to challenge the space

## Your move — break free as Black

\`\`\`chess
mode: interactive
respond: true
flip: true
fen: r1bqkb1r/pp1n1ppp/2p1pn2/3pP3/2PP4/2N2N2/PP3PPP/R1BQKB1R b KQkq - 0 1
caption: You're Black and cramped. Don't sit still — strike the base of White's chain: play c5, hitting d4. Trades and open lines relieve the squeeze. The board answers as White.
\`\`\`

## The trap

Over-extend and your advanced pawns become **weaknesses** instead of strengths. Hold the space, but keep the pawns defensible.`,
          order: 5,
          difficulty: 3,
          estimatedMinutes: 18,
        },
      ],
    },

    {
      slug: 'advanced-tactics',
      title: 'Advanced Tactics',
      description: 'The combinational motifs that decide sharp middlegames',
      level: 'intermediate',
      order: 4,
      icon: 'Zap',
      lessons: [
        {
          slug: 'zwischenzug',
          title: 'Zwischenzug (In-Between Move)',
          description: 'Insert a forcing move before the "obvious" recapture',
          content: `# Zwischenzug — the In-Between Move

German for *"in-between move"*. The opponent expects you to recapture. You don't. You make a **more forcing move first**.

## See it in action

\`\`\`chess
mode: animate
fen: r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 w kq - 0 1
moves: Bxf7+ Kxf7
caption: Imagine White just took on f7. You'd expect the king to recapture — yes. But sometimes you can squeeze in a CHECK first, win material, THEN take.
\`\`\`

## The killer trick

Recaptures feel automatic. But a **check** or **mate threat** is more forcing — it jumps the queue. Slip one in and you collect extra material before the dust settles.

## Try thinking like this

\`\`\`chess
mode: interactive
fen: 4k3/8/4r3/8/8/4R3/8/4K3 w - - 0 1
caption: If you trade rooks (Rxe6 Rxe1 Kxe1), the position is equal. But always ask: "Before I recapture, do I have a CHECK or bigger threat?"
\`\`\`

## The one-question rule

Before every recapture, ask yourself: ***"Do I have a check or a bigger threat first?"*** This single habit catches countless wins that lazy players miss.

The zwischenzug is one of the most **overlooked** resources in chess. Strong players see it; club players don't.`,
          order: 1,
          difficulty: 4,
          estimatedMinutes: 15,
        },
        {
          slug: 'the-windmill',
          title: 'The Windmill',
          description: 'A see-saw of discovered checks that strips the board bare',
          content: `# The Windmill

The most **spectacular** tactic in chess. A rook and bishop combine to deliver a chain of discovered checks, harvesting enemy material on every turn.

## Watch the see-saw scythe through

\`\`\`chess
mode: animate
fen: 7k/ppp3Rp/8/8/8/8/1B3PPP/6K1 w - - 0 1
moves: Rxc7+ Kg8 Rg7+ Kh8 Rxb7+ Kg8 Rg7+ Kh8 Rxa7+ Kg8 Rg7+ Kh8
autoplay: true
caption: Every time the rook leaves g7, the bishop on b2 checks. The rook devours the 7th rank pawn by pawn. The king bounces helplessly.
\`\`\`

## The recipe

1. **Bishop** with a clear long diagonal to the enemy king
2. **Rook** that alternates between blocking the diagonal (with check) and capturing
3. **Enemy king** with only ONE shuffle square between

The king is forced to bounce back-and-forth while you eat everything in reach.

## Spot the setup

\`\`\`chess
mode: interactive
fen: 5rk1/6Rp/8/8/8/8/1B6/6K1 w - - 0 1
caption: Bishop on b2 ✓ Rook on g7 with discovered check ready ✓. The windmill is loaded — Rxh7+ Kxh7? Or even just keep cycling.
\`\`\`

The most famous windmill: **Torre vs Lasker, Moscow 1925** — Torre's rook scythed through Black's pieces and won the queen at the end of the cycle. One of the most beautiful games ever played.`,
          order: 2,
          difficulty: 5,
          estimatedMinutes: 18,
        },
        {
          slug: 'clearance-sacrifice',
          title: 'Clearance Sacrifice',
          description: 'Vacate a square or line — even by giving up material — to let another piece through',
          content: `# Clearance Sacrifice

Sometimes the piece in your way is **your own**. A clearance sacrifice gives up material to vacate a key square, file, or diagonal so a bigger threat can land.

## Watch a line clearance

\`\`\`chess
mode: interactive
fen: 6k1/5ppp/8/8/8/8/4RPPP/3R2K1 w - - 0 1
caption: White wants Rd8+ but the rook on e2 isn't on the d-file. The IDEA: if a piece blocks your file, sacrifice it with a forcing move so your big threat lands.
\`\`\`

## Two flavors

- **Line clearance** — open a rank/file/diagonal for a long-range piece
- **Square clearance** — vacate a key square so a knight or piece can land there

## The detective question

When you spot a crushing move that's **almost** possible — blocked only by your own unit — ask: *"Can I shift my own piece out of the way **with tempo**?"* If the shifted piece makes its own threat, the opponent must answer it, and your real move lands next turn.

## The deal

A clearance sacrifice trades **material for time and access**. Only do it if the opened line wins more than you gave up. Calculate to the end.

## Try the thought process

\`\`\`chess
mode: interactive
fen: 3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
caption: Rooks face off on the d-file. If you could just clear your own d1-rook with check or a bigger threat, you'd own the file. That hunt for clearance is the tactic.
\`\`\``,
          order: 3,
          difficulty: 5,
          estimatedMinutes: 15,
        },
        {
          slug: 'interference',
          title: 'Interference',
          description: 'Cut the line between an enemy piece and what it defends',
          content: `# Interference

The rarest and most beautiful tactical idea: **plant your own piece between an enemy piece and what it defends** — cutting the line.

## The pattern

\`\`\`chess
mode: interactive
fen: 3r2k1/8/8/8/8/8/3B4/3R2K1 w - - 0 1
caption: White's d2-bishop and d1-rook face Black's d8-rook. The bishop interferes — if it could be sacrificed mid-file, the rook battery would have a clean shot.
\`\`\`

## Why nobody sees it

Captures and checks scream "look at me!". A **quiet interposition** on an empty square — often putting a piece *en prise* — looks insane until you see the point.

## The Novotny — two defenses cut at once

Drop a piece on a square where **two** enemy line-pieces cross. Whichever one captures, it blocks the other. One sacrifice severs two defenses.

## Hunt for it

When stuck, ask: *"What is that enemy piece defending? Can I put something **on the line** to cut it off?"* The defender suddenly can't defend, and what it was guarding falls.

\`\`\`chess
mode: interactive
fen: 6k1/3q4/8/3R4/8/3B4/8/6K1 w - - 0 1
caption: Black's queen on d7 defends the d-file. If you could plant a piece between d3 and d7 with a threat, the queen couldn't recapture without losing.
\`\`\`

Interference is what separates calculation wizards from the rest. It's worth one whole rating class on its own.`,
          order: 4,
          difficulty: 5,
          estimatedMinutes: 15,
        },
        {
          slug: 'desperado',
          title: 'The Desperado',
          description: 'A doomed piece sells itself as dearly as possible',
          content: `# The Desperado

A piece that's **going to be lost anyway** — so it grabs as much material as it can on its way out. The chess version of "go down swinging."

## See it pay off

\`\`\`chess
mode: interactive
fen: 4k3/8/8/4p3/3n4/8/3P4/4K3 w - - 0 1
caption: White's d2-pawn is attacked by Black's knight. Before it dies — take the e5-pawn (d2 isn't the desperado here, but the IDEA is: a doomed piece grabs material on its way out).
\`\`\`

## The mindset that wins games

When you realize a piece is lost, **don't sigh and give it up**. Ask:
- *Can it capture something on the way out?*
- *Can it force a favorable trade?*
- *Can it block a critical square long enough for help to arrive?*

## A defensive desperado

\`\`\`chess
mode: interactive
fen: 7k/6pp/8/8/8/8/q7/6QK w - - 0 1
caption: White's queen is losing material soon. Throw it at the king with checks — perpetual check forces a draw from a lost position.
\`\`\`

## The lesson

**No piece should die for free.** Squeeze every last bit of value out of a doomed unit — a captured pawn, a tempo, a draw by repetition. That's the desperado.`,
          order: 5,
          difficulty: 4,
          estimatedMinutes: 15,
        },
      ],
    },
    {
      slug: 'strategic-thinking',
      title: 'Strategic Thinking',
      description: 'The planning skills that separate good players from great ones',
      level: 'intermediate',
      order: 5,
      icon: 'Lightbulb',
      lessons: [
        {
          slug: 'piece-values-and-trading',
          title: 'Piece Values & Trading',
          description: 'Know what your pieces are worth and when to swap them',
          content: `# Piece Values & Trading

Every piece has a price. Knowing it tells you instantly whether a trade is good, bad, or a disaster.

## The point system

\`\`\`chess
mode: interactive
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
caption: Pawn = 1 · Knight = 3 · Bishop = 3 · Rook = 5 · Queen = 9 · King = priceless. Memorize these — they guide every capture.
\`\`\`

## A good trade wins material

\`\`\`chess
mode: animate
fen: 4k3/8/8/6r1/8/4B3/8/4K3 w - - 0 1
moves: Bxg5
caption: Bishop (3) takes rook (5) — you gain 2 points of material. A clearly good trade.
\`\`\`

## The trading rules

1. **Trade when you're ahead** — fewer pieces makes your extra material decisive
2. **Avoid trades when behind** — you need pieces on the board to create chances
3. **Trade your bad pieces** for the opponent's good ones
4. **Never trade a higher value for a lower** unless it wins something bigger (a mate, a fork, a promotion)

## Count before every capture

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3q4/4P3/8/8/4K3 w - - 0 1
caption: The pawn can take the queen! exd5 wins 9 points for free. Always check: is something hanging?
\`\`\`

Counting material is the first habit of every strong player. Do it every move.`,
          order: 1,
          difficulty: 1,
          estimatedMinutes: 12,
        },
        {
          slug: 'prophylaxis',
          title: 'Prophylaxis',
          description: "Stop your opponent's plan before you push your own",
          content: `# Prophylaxis

The most underrated skill in chess: **prevent your opponent's idea** before you chase your own. Named by Aron Nimzowitsch.

## The key question

Before every move, ask: ***"What does my opponent want to do?"*** Then stop it.

\`\`\`chess
mode: interactive
fen: r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1
caption: Before developing further, notice Black eyes ...Ng4 and ...d5 breaks. A prophylactic move like h3 quietly removes a threat before it appears.
\`\`\`

## A famous prophylactic move

\`\`\`chess
mode: animate
fen: r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1
moves: h3
caption: h3 looks like a "nothing" move — but it permanently stops ...Bg4 and ...Ng4. Small, quiet, strong.
\`\`\`

## How to play prophylactically

1. Spot the opponent's **most natural plan**
2. Ask if **one quiet move** can prevent it
3. Make that move — *then* pursue your own ideas

## Why it wins

Most players think only about their own attack. The prophylactic player sees both sides of the board — and slowly suffocates the opponent's counterplay. It's how Karpov and Petrosian crushed the world.`,
          order: 2,
          difficulty: 4,
          estimatedMinutes: 15,
        },
        {
          slug: 'two-weaknesses',
          title: 'The Principle of Two Weaknesses',
          description: 'One weakness rarely loses — two usually do',
          content: `# The Principle of Two Weaknesses

A single weakness can often be defended. **Two weaknesses** on opposite sides of the board stretch the defender until something snaps.

## Why one isn't enough

\`\`\`chess
mode: interactive
fen: 6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1
caption: If Black has just ONE weak pawn, the defender plants a piece on it and holds. You need a SECOND target to win.
\`\`\`

## Open a second front

\`\`\`chess
mode: interactive
fen: 6k1/p4ppp/8/8/8/8/5PPP/R5K1 w - - 0 1
caption: Black has a weak a7-pawn AND a vulnerable king. White attacks BOTH — the defender can't cover both sides at once.
\`\`\`

## The winning method

1. Create or fix a **first weakness** (a weak pawn, a draughty king)
2. Tie an enemy piece down to defending it
3. Open a **second front** elsewhere
4. The overloaded defender collapses

## The big idea

Strong players don't just pile up on one target. They **provoke a second weakness**, then bounce the attack between the two until the defense cracks. It's the deepest winning method in chess strategy.`,
          order: 3,
          difficulty: 4,
          estimatedMinutes: 15,
        },
        {
          slug: 'improve-your-worst-piece',
          title: 'Improve Your Worst Piece',
          description: "The simplest plan when you don't know what to do",
          content: `# Improve Your Worst Piece

Stuck for a plan? Here's the most practical advice in all of chess: **find your worst-placed piece and make it better.**

## Spot the sad piece

\`\`\`chess
mode: interactive
fen: r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1
caption: Which white piece is doing the least? The c1-bishop is hemmed in. Finding a good square for it is your plan.
\`\`\`

## Reroute it to a better home

\`\`\`chess
mode: animate
fen: r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1 w - - 0 1
moves: Bg5
caption: Bg5 develops the sleepy bishop to an active square, pinning the f6-knight. The worst piece just became useful.
\`\`\`

## The method

1. Look at **all your pieces**, one by one
2. Find the one with the **fewest good squares** or no purpose
3. Find it a better home — even if it takes two or three moves

## Why it works

A position is only as strong as its **weakest piece**. When every piece is active, threats appear by themselves. When you have no plan, this rule always gives you one.

*"Sit on your hands and find your worst piece"* — the timeless coaching advice.`,
          order: 4,
          difficulty: 3,
          estimatedMinutes: 12,
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

The oldest opening in chess. White grabs the center and aims a bishop straight at **f7** — Black's most vulnerable square.

## See the opening

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bc4
autoplay: true
caption: 1.e4 e5  2.Nf3 Nc6  3.Bc4 — the Italian. White's bishop already eyes f7.
\`\`\`

## Why Bc4?

\`\`\`chess
mode: interactive
fen: r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4
caption: The bishop on c4 attacks f7 — defended only by the king. One careless move from Black and the f7 square cracks open.
\`\`\`

## Three flavors

| Variation | Black's reply | Character |
|---|---|---|
| **Giuoco Piano** | 3...Bc5 | Calm, classical |
| **Two Knights** | 3...Nf6 | Sharper — White can play 4.Ng5! |
| **Evans Gambit** | (after 3...Bc5) 4.b4!? | White sacs a pawn for tempo |

## Try the Giuoco

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4
autoplay: true
caption: The Giuoco Piano main line — calm development, then White breaks with d4 to claim the center.
\`\`\`

**Italian rule of thumb:** any move that doesn't develop or attack f7 is a missed chance.`,
          order: 1,
          difficulty: 3,
          estimatedMinutes: 25,
        },
        {
          slug: 'ruy-lopez',
          title: 'Ruy Lopez',
          description: 'The "Spanish Torture" — one of the most respected openings in chess',
          content: `# The Ruy Lopez

Named after a 16th-century Spanish priest. Played at every level for 500 years — including most world championship matches. Nickname: **"Spanish Torture"**.

## Watch the squeeze

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O
autoplay: true
caption: The bishop pressures the c6-knight (which defends e5). White finishes development and starts a slow strategic squeeze.
\`\`\`

## The key idea — why 3.Bb5?

\`\`\`chess
mode: interactive
fen: r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3
caption: The bishop pins the c6-knight indirectly. If Black plays carelessly, White could grab e5 by removing the c6-knight first.
\`\`\`

## The three main responses for Black

- **Morphy** (3...a6) — kicks the bishop, lets it choose
- **Berlin** (3...Nf6) — solid as concrete, drawn World Championship matches
- **Exchange** (after 3...a6 4.Bxc6) — trade now, target Black's doubled pawns

## Why play it as White?

Slow, strategic, **rich middlegames**. The Ruy Lopez doesn't give knockouts — it gives you a tiny edge that grows for 40 moves. The world champion's choice.`,
          order: 2,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'sicilian-defense',
          title: 'Sicilian Defense',
          description: "Black's most aggressive and popular answer to 1.e4",
          content: `# The Sicilian Defense

Black's **most popular** answer to 1.e4 — and the most combative. Black plays for a win, not a draw.

## The Open Sicilian

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3
autoplay: true
caption: Black trades a flank pawn (c5) for a center pawn (d4). Half-open c-file for rook play, sharp middlegames — exactly what Black wanted.
\`\`\`

## The structural trade

\`\`\`chess
mode: interactive
fen: rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 2 5
caption: Black has fewer central pawns BUT a half-open c-file pointing at White's queenside. Active piece play in exchange for some center.
\`\`\`

## Pick your flavor

| Variation | Black's move | Style |
|---|---|---|
| **Najdorf** | 5...a6 | Razor-sharp, world-champion favorite |
| **Dragon** | ...g6 | Fianchetto + ...Bg7 dragon-like |
| **Classical** | ...Nc6 | Solid central setup |
| **Taimanov** | ...e6 + ...Nc6 | Flexible, modern |

## Why Sicilian players love it

Asymmetry = imbalance = winning chances. If you want to play 1...e5 and slowly draw, choose a different defense. If you want to **fight**, this is your weapon.`,
          order: 3,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'queens-gambit',
          title: "Queen's Gambit",
          description: 'A classical queenside opening that fights for the center',
          content: `# The Queen's Gambit

The Netflix-famous opening. White offers a c-pawn to **deflect** Black's d5-pawn — winning control of the center, not really losing a pawn.

## The opening move

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 d5 c4
autoplay: true
caption: 1.d4 d5  2.c4 — offering the c-pawn. The "gambit" is half-fake: White usually gets the pawn back.
\`\`\`

## Why it's not a real gambit

\`\`\`chess
mode: interactive
fen: rnbqkbnr/ppp1pppp/8/3p4/2P5/8/PP1PPPPP/RNBQKBNR b KQkq c3 0 2
caption: If Black plays ...dxc4 to keep the pawn, White just plays e3 and Bxc4 — back to equal. The point isn't the pawn; it's the central control.
\`\`\`

## The Queen's Gambit Declined (the main line)

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O
autoplay: true
caption: ...e6 supports d5 and Black develops solidly. The QGD has been a championship-level opening for over a century.
\`\`\`

## Three ways Black can answer

- **Declined** (2...e6) — solid, classical
- **Slav** (2...c6) — defends d5 AND keeps the c8-bishop free
- **Accepted** (2...dxc4) — grabs the pawn, gives up center

A timeless, deeply strategic opening.`,
          order: 4,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'french-defense',
          title: 'French Defense',
          description: 'A solid, counterattacking answer to 1.e4',
          content: `# The French Defense

Solid as concrete. Black lets White build a big center — then **detonates** it with ...c5.

## The starting position

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e6 d4 d5
autoplay: true
caption: 1.e4 e6  2.d4 d5 — Black challenges the center immediately. White's e4 and Black's d5 stare each other down.
\`\`\`

## The "French bishop" problem

\`\`\`chess
mode: interactive
fen: rnbqkb1r/pp3ppp/4pn2/2pp4/3P4/2N1P3/PPP2PPP/R1BQKBNR w KQkq - 0 5
caption: Black's c8-bishop is hemmed in by its own pawn on e6. This "bad French bishop" haunts every French game. Plans must free it.
\`\`\`

## The signature break — ...c5

\`\`\`chess
mode: animate
fen: rnbqkb1r/ppp2ppp/4pn2/3p4/3PP3/2N5/PPP2PPP/R1BQKBNR b KQkq - 1 3
moves: dxe4 Nxe4 c5
caption: ...c5 strikes White's d4 — the pawn break that defines French strategy.
\`\`\`

## Pick a flavor

| Variation | White plays | Style |
|---|---|---|
| **Advance** | 3.e5 | Space-grab; Black hits back with ...c5 |
| **Winawer** | 3.Nc3 Bb4 | Sharp, doubled-pawn theme |
| **Tarrasch** | 3.Nd2 | Flexible, low-risk |
| **Exchange** | 3.exd5 | Symmetric, dull |

The French isn't flashy — but it scores. Karpov made a career of it.`,
          order: 5,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'caro-kann',
          title: 'Caro-Kann Defense',
          description: 'Solid like the French, but with a free light-squared bishop',
          content: `# The Caro-Kann Defense

As solid as the French — but Black **frees the light-squared bishop first**. Karpov's other favorite.

## Watch the main line

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5
autoplay: true
caption: The Classical Caro-Kann: ...Bf5 frees the c8-bishop BEFORE locking it in with ...e6. Solid AND active.
\`\`\`

## French vs Caro-Kann

\`\`\`chess
mode: interactive
fen: rnbqkb1r/pp2pppp/2p2n2/8/3P4/8/PPP2PPP/R1BQKBNR w KQkq - 0 5
caption: Same idea as the French (solid, central) — but Black's bishop on c8 still has the c8-h3 diagonal open. That's the Caro-Kann's gift.
\`\`\`

## Why positional players love it

- **Sound, reliable** structure — few targets for White
- **Bishop gets out** to f5 or g4
- **Better endgames** than the French
- Patience pays off

## Variations

- **Classical** (4...Bf5) — the principled main line
- **Advance** (3.e5) — space-grabbing; Black plays ...Bf5 and prepares ...c5 or ...e6
- **Panov-Botvinnik** (3.exd5 cxd5 4.c4) — sharp, isolated-pawn middlegames

A workhorse defense. If you want positions where you grind for a win in the endgame, this is your tool.`,
          order: 6,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'english-opening',
          title: 'English Opening',
          description: 'A flexible flank opening that fights for the center from the side',
          content: `# The English Opening

**1.c4** — stake a claim on d5 from the side. Flexible, strategic, and a great way to dodge mainstream 1.e4 / 1.d4 theory.

## The Reversed Sicilian

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: c4 e5 Nc3 Nf6 Nf3 Nc6 g3 d5 cxd5 Nxd5
autoplay: true
caption: White plays a Sicilian setup with an extra tempo. Fianchetto on g3, then play down the long diagonal.
\`\`\`

## The signature move — g3

\`\`\`chess
mode: interactive
fen: r1bqkb1r/pppp1ppp/2n2n2/4p3/2P5/2N3P1/PP1PPP1P/R1BQKBNR w KQkq - 0 4
caption: g3 + Bg2 is the English's calling card. The g2-bishop rakes the long h1-a8 diagonal toward Black's queenside.
\`\`\`

## Why play the English

- **Flexible** — can transpose to Queen's Gambit, Catalan, even Sicilian structures
- **Avoid theory** — 1.e4 and 1.d4 have huge databases; the English keeps your opponent thinking
- **Strategic play** — long maneuvering, less tactical chaos

## Setups you'll meet

| Black's reply | Name |
|---|---|
| 1...e5 | Reversed Sicilian |
| 1...c5 | Symmetrical English |
| 1...Nf6 | King's Indian setups |
| 1...e6 | Transposes to Queen's Gambit lines |

The English is the **chameleon** of openings. Botvinnik and Kasparov played it for a reason.`,
          order: 7,
          difficulty: 4,
          estimatedMinutes: 22,
        },
        {
          slug: 'london-system',
          title: 'London System',
          description: 'An easy-to-learn setup you can play against almost anything',
          content: `# The London System

The opening you can learn in one afternoon. White develops the **same way** against almost everything. Beloved by club players and increasingly by elites too.

## The setup, every time

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 d5 Nf3 Nf6 Bf4 e6 e3 Bd6 Bg3 O-O Bd3 c5 c3 Nc6 Nbd2
autoplay: true
caption: The whole London System unfolds: Bf4, e3, Bd3, c3, Nbd2. Memorize the pattern and you have an opening for life.
\`\`\`

## The crucial trick — bishop OUT first

\`\`\`chess
mode: interactive
fen: rnbqkbnr/ppp1pppp/8/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 0 3
caption: Play Bf4 BEFORE e3! If you play e3 first, your dark bishop gets trapped behind its own pawns. The bishop's escape is the system's #1 rule.
\`\`\`

## The middlegame plan

\`\`\`chess
mode: animate
fen: r1bq1rk1/pp3ppp/2nbpn2/3p4/3P4/2PBPN2/PP1N1PPP/R2Q1RK1 w - - 0 8
moves: Ne5
caption: Once developed, the standard plan: Ne5 lands a knight in the center, often followed by f4 and a kingside attack.
\`\`\`

## Why London is everywhere

- **Easy to learn** — one setup against nearly every defense
- **Solid** — hard for Black to crack
- **Plays itself** — once you know the moves, low memory load

Watch out for: ...c5 and ...Qb6 (hitting b2 and d4) — Black's standard counter. Otherwise, you're cruising.`,
          order: 8,
          difficulty: 3,
          estimatedMinutes: 22,
        },
        {
          slug: 'kings-indian-defense',
          title: "King's Indian Defense",
          description: 'Let White build a big center — then blow it up with a kingside attack',
          content: `# The King's Indian Defense

A **fighting** defense. Black lets White build a huge center — then blows it up with a kingside pawn storm. Not for the faint-hearted.

## See the setup

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O
autoplay: true
caption: Black fianchettoes the dark-squared bishop, castles, and prepares to fight the center from a distance.
\`\`\`

## The g7-bishop — Black's secret weapon

\`\`\`chess
mode: interactive
fen: rnbqk2r/ppp1ppbp/3p1np1/8/2PPP3/2N5/PP3PPP/R1BQKBNR w KQ - 1 5
caption: The Bg7 rakes the entire a1-h8 diagonal. It pressures White's center and stays in place all game.
\`\`\`

## The classic race

\`\`\`chess
mode: animate
fen: rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP3PPP/R1BQKB1R w KQ - 1 6
moves: Be2 e5 d5 a5 O-O Na6 Ne1 Nd7
autoplay: true
caption: After ...e5, the center locks. Black starts ...f5-f4-g5-g4 storming the kingside while White attacks on the queenside. Race time.
\`\`\`

## The big bet

The KID is a **bet that you'll attack the king faster than the opponent attacks your queen**. Win the race, win the game. The favorite opening of Fischer and Kasparov.`,
          order: 9,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'scandinavian-defense',
          title: 'Scandinavian Defense',
          description: 'Challenge the e4-pawn immediately with 1...d5',
          content: `# The Scandinavian Defense

The most direct answer to 1.e4: **hit back with 1...d5 immediately**. No theory to memorize, no traps to fear.

## The simplest defense in chess

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6
autoplay: true
caption: 1...d5! After exd5 Qxd5, the queen retreats to a5 and Black gets a sound, easy-to-play position.
\`\`\`

## The bishop you free

\`\`\`chess
mode: interactive
fen: rnb1kbnr/ppp1pppp/8/q7/3P4/2N5/PPP2PPP/R1BQKBNR w KQkq - 2 4
caption: The c8-bishop has open diagonals — unlike the French where it gets locked in. The Scandinavian's structural plus.
\`\`\`

## Two flavors

- **3...Qa5** — classic retreat, well-tested
- **3...Qd6** — modern and flexible, popular at all levels

## A gambit version too

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 d5 exd5 Nf6
autoplay: true
caption: The 2...Nf6 gambit — Black delays the recapture for faster development. Sharper, riskier.
\`\`\`

## Who should play it?

Players who want a **reliable defense without memorizing 30 moves**. The Scandinavian rewards understanding over preparation.`,
          order: 10,
          difficulty: 3,
          estimatedMinutes: 22,
        },
        {
          slug: 'nimzo-indian-defense',
          title: 'Nimzo-Indian Defense',
          description: "Pin the knight and play against White's pawn structure",
          content: `# The Nimzo-Indian Defense

The deepest strategic battle in opening theory: **bishop pair vs damaged pawns**. Both sides get something, and the play decides which matters more.

## The defining move

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 Nf6 c4 e6 Nc3 Bb4
autoplay: true
caption: 3...Bb4 — the Nimzo. Pinning the knight, ready to trade it for the bishop and damage White's structure.
\`\`\`

## The trade-off in one position

\`\`\`chess
mode: interactive
fen: rnbqk2r/pppp1ppp/4pn2/8/2PP4/2P5/P3PPPP/R1BQKBNR b KQkq - 0 4
caption: After ...Bxc3 bxc3, White has doubled c-pawns (weakness) BUT the bishop pair (strength). Black blockades the pawns and plays for the long game.
\`\`\`

## Why champions love it

- **Flexible** — Black isn't committed to any one pawn structure
- **Sound** — extremely solid against 1.d4
- **Active** — clear plans for both sides; rarely boring
- **Deep** — every move matters; perfect for strong players

## A sample main line

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5
autoplay: true
caption: Black castles, strikes with ...d5 and ...c5. A model Nimzo middlegame.
\`\`\`

If you ever wondered how Karpov, Petrosian, and Kasparov built winning systems against 1.d4 — it usually started here.`,
          order: 11,
          difficulty: 4,
          estimatedMinutes: 25,
        },
      ],
    },
    {
      slug: 'attacking-play',
      title: 'Attacking the King',
      description: 'Sacrifices and pawn storms to hunt down the enemy king',
      level: 'advanced',
      order: 2,
      icon: 'Flame',
      lessons: [
        {
          slug: 'greek-gift',
          title: 'The Greek Gift Sacrifice',
          description: 'The classic Bxh7+ bishop sacrifice against a castled king',
          content: `# The Greek Gift Sacrifice

The most famous attacking pattern in chess: **Bxh7+!** — a bishop sacrifice that rips open the castled king.

## Watch the gift unwrap

\`\`\`chess
mode: animate
fen: r1bq1rk1/ppp2ppp/2n2n2/3p4/3P4/2NB1N2/PPP2PPP/R1BQ1RK1 w - - 0 1
moves: Bxh7+ Kxh7 Ng5+ Kg8 Qh5
autoplay: true
caption: Bxh7+! drags the king out. Ng5+ leaps in. Qh5 threatens unstoppable Qh7 mate.
\`\`\`

## The three ingredients

\`\`\`chess
mode: interactive
fen: r1bq1rk1/ppp2ppp/2n2n2/3p4/3P4/2NB1N2/PPP2PPP/R1BQ1RK1 w - - 0 1
caption: SETUP CHECKLIST — (1) bishop on d3 aimed at h7 ✓ (2) knight ready to leap to g5 ✓ (3) queen with a fast route to h5 or h7 ✓. All three present? The Greek Gift is on.
\`\`\`

## When NOT to play it

- Black has a **knight on f6** (it covers h5 and h7 — the attack stalls)
- The king can safely run to **g6** with shelter
- You can't deliver enough force to mate or win major material

**Calculate to a clear win before sacrificing.** Hope is not a strategy.

## Try spotting it

Whenever you see your bishop on d3, knight on f3, and Black has castled with no Nf6 — *check the Greek Gift*. It's worked thousands of times in real games.`,
          order: 1,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'pawn-storms',
          title: 'Pawn Storms',
          description: 'March your pawns at the enemy king to tear open lines',
          content: `# Pawn Storms

When the kings castle on **opposite sides**, the game becomes a race. Throw your pawns at the enemy king. Whoever opens lines first usually wins.

## See the storm

\`\`\`chess
mode: animate
fen: r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1B3/PPPQ1PPP/2KR1B1R w - - 0 1
moves: h4 a6 h5 b5 hxg6 hxg6 g4
autoplay: true
caption: White castled queenside, Black kingside. White hurls the h- and g-pawns at Black's king. Speed beats safety here.
\`\`\`

## Same-side castling? Be careful

\`\`\`chess
mode: interactive
fen: r1bq1rk1/pp3ppp/2n2n2/3p4/3P4/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 1
caption: Same side castling — storming your own kingside pawns would expose YOUR king too. Reserve pawn storms for opposite-side castling.
\`\`\`

## Three rules for a successful storm

1. **Don't worry about your own structure** near the enemy king — even sacrifice pawns
2. **Open at least one file** for a rook — a closed storm achieves nothing
3. **Count the race** — calculate whose attack lands first. One tempo can win or lose

## The key question every move

*"Whose king will fall first?"* If you can't answer that confidently, slow down and bring more attackers. Speed wins, but only if you have enough force.`,
          order: 2,
          difficulty: 5,
          estimatedMinutes: 22,
        },
      ],
    },
    {
      slug: 'advanced-endgames',
      title: 'Advanced Endgames',
      description: 'The precise techniques that win (and draw) tricky endings',
      level: 'advanced',
      order: 3,
      icon: 'Castle',
      lessons: [
        {
          slug: 'lucena-position',
          title: 'The Lucena Position',
          description: 'The fundamental winning method in rook-and-pawn endgames',
          content: `# The Lucena Position

The **most important winning technique** in rook endgames. Memorize it once and convert countless "drawn-looking" rook endings into wins.

## The setup

\`\`\`chess
mode: interactive
fen: 1K6/1P6/8/8/8/8/r7/2R3k1 w - - 0 1
caption: K + R + pawn on the 7th, king in front of it. Sounds winning — but if the king steps aside, the rook checks drive it back. We need a "bridge".
\`\`\`

## Building the bridge

\`\`\`chess
mode: interactive
fen: 1K6/1P6/8/8/2R5/8/r7/6k1 w - - 0 1
caption: Rook already on c4 = the bridge in place. Now the king walks out (Kc7, Kc6...), and when the enemy rook checks from the side, your rook blocks on the c-file. Pawn queens.
\`\`\`

## The technique in four steps

1. **Rook to your 4th rank** (e.g. Rc4 for a c-pawn)
2. **King steps out** toward the rook's side
3. When checked, **interpose your rook** as the bridge
4. **Pawn queens** — you win

## Why it works

The rook on the 4th rank shortens the distance enemy checks can harass you. Then when the final check comes, your rook blocks it. The king escapes the gauntlet and the pawn promotes.

**This is THE rook-endgame technique to know.** It comes up in dozens of games — turning many a "draw" into a win.`,
          order: 1,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'philidor-position',
          title: 'The Philidor Position',
          description: 'The fundamental drawing method when defending rook endgames',
          content: `# The Philidor Position

The **defender's best friend** in rook endgames. If your opponent has a rook AND a pawn and you have only a rook, Philidor holds the draw.

## See the defense

\`\`\`chess
mode: interactive
fen: 8/8/4k3/8/4P3/r7/4K3/4R3 b - - 0 1
caption: Black's rook camps on its 3rd rank (a3 here). The white king CAN'T advance — every square ahead is covered by the Black rook.
\`\`\`

## Two-phase technique

**Phase 1 — Third-rank defense.** While the white pawn is on e4 or e5, keep your rook on your 3rd rank. The enemy king can't squeeze past.

**Phase 2 — Rear checks.** The moment the pawn pushes to your 3rd rank (e3 here, or e6 for the other side), **swing your rook to the back rank** and start checking from behind. The king has no shelter.

## Why it works

The attacker wins only if the **king** can shepherd the pawn forward. The 3rd-rank rook blocks that. When the pawn over-extends to escape, your rook's checks from behind never end. **Draw.**

## Lucena vs Philidor — know which you're in

| Position | Result |
|---|---|
| Your king IN FRONT of the pawn | Lucena = win |
| Your king KEPT OUT, defender's rook on its 3rd rank | Philidor = draw |

This pair of positions defines who wins or loses rook endgames. Learn both and you'll save and convert half a point a week.`,
          order: 2,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'bishop-knight-mate',
          title: 'Bishop & Knight Checkmate',
          description: 'The hardest basic mate — driving the king to the right corner',
          content: `# Bishop & Knight Checkmate

The **trickiest** of the basic mates. K + B + N vs K is forced — but you can only mate in **a corner the same color as your bishop**.

## The starting position

\`\`\`chess
mode: interactive
fen: 8/8/8/8/8/2N5/3BK3/7k w - - 0 1
caption: Your dark-squared bishop means you can ONLY mate in a dark corner (a1 or h8). Black's king is already near h1 — wrong corner. You must drive it across the board.
\`\`\`

## The W-maneuver — guiding the king

The hardest part: getting the king from the wrong corner to the right one. The knight does most of the herding via a famous **W-shaped path**.

\`\`\`chess
mode: interactive
fen: 8/8/8/2k5/8/6N1/3BK3/8 w - - 0 1
caption: Coordinate king + bishop + knight to herd the enemy king toward the correct corner. The knight zig-zags in a W-shape to control the squares the bishop can't.
\`\`\`

## Three rules to survive

1. **Bishop and king herd**; the knight closes the door
2. **Move all three pieces** — don't leave one behind
3. Watch the **50-move rule** — this mate can take 30+ moves

## Why bother learning it?

This is the mate of legends — the one that separates club players from real endgame artists. Even if you never play it, **practicing the coordination teaches you how three pieces work together**, which pays off in every game.`,
          order: 3,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'wrong-bishop',
          title: 'The Wrong Bishop',
          description: 'When an extra bishop and a rook pawn still only draw',
          content: `# The Wrong Bishop

One of chess's great surprises: **K + B + rook pawn** — material that *looks* winning — is a draw if the bishop is the wrong color.

## See the impossible draw

\`\`\`chess
mode: interactive
fen: 8/8/8/8/8/6b1/5k1p/7K w - - 0 1
caption: White's king is trapped in the corner. Black has an EXTRA PIECE. But Black's bishop is DARK; h1 is LIGHT. Bishop can never touch h1 — King sits forever — DRAW.
\`\`\`

## The rule

With a rook pawn (a- or h-file), the promotion square sits in the **corner**. If your bishop doesn't match that corner's color, **you can never drive the enemy king away**.

| Pawn | Promotion square | Need this bishop |
|---|---|---|
| h-pawn | h8 (light) | Light-squared |
| h-pawn | h1 (light, Black side) | Light-squared |
| a-pawn | a8 (dark) | Dark-squared |
| a-pawn | a1 (dark, Black side) | Dark-squared |

## How to use this knowledge

**As the stronger side:** *avoid* trading into a wrong-bishop ending. Keep an extra pawn somewhere; preserve the right bishop.

**As the defender:** when losing, **race for the wrong-bishop corner**. It's a lifeline that saves countless lost-looking games.

## See it as a defender

\`\`\`chess
mode: interactive
fen: 7k/8/8/8/8/8/6PP/4K1B1 w - - 0 1
caption: White has K + B + 2 rook pawns. If only one pawn remained on h-file and the bishop is dark — drawn! Black just heads for h8 and sits there.
\`\`\`

This is the rule that saves more half-points than any other. Memorize it.`,
          order: 4,
          difficulty: 5,
          estimatedMinutes: 20,
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
    {
      id: 'opera-game',
      white: 'Paul Morphy',
      black: 'Duke of Brunswick & Count Isouard',
      year: 1858,
      event: 'Paris Opera',
      result: '1-0',
      pgn: '1.e4 e5 2.Nf3 d6 3.d4 Bg4 4.dxe5 Bxf3 5.Qxf3 dxe5 6.Bc4 Nf6 7.Qb3 Qe7 8.Nc3 c6 9.Bg5 b5 10.Nxb5 cxb5 11.Bxb5+ Nbd7 12.O-O-O Rd8 13.Rxd7 Rxd7 14.Rd1 Qe6 15.Bxd7+ Nxd7 16.Qb8+ Nxb8 17.Rd8# 1-0',
      eco: 'C41',
      themes: 'sacrifice,attack,development,romantic',
      difficulty: 2,
    },
    {
      id: 'evergreen-game',
      white: 'Adolf Anderssen',
      black: 'Jean Dufresne',
      year: 1852,
      event: 'Berlin',
      result: '1-0',
      pgn: '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O d3 8.Qb3 Qf6 9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4 Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6 Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7 22.Bf5+ Ke8 23.Bd7+ Kf8 24.Bxe7# 1-0',
      eco: 'C52',
      themes: 'sacrifice,attack,combination,romantic',
      difficulty: 4,
    },
    {
      id: 'reti-tartakower',
      white: 'Richard Réti',
      black: 'Savielly Tartakower',
      year: 1910,
      event: 'Vienna',
      result: '1-0',
      pgn: '1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nf6 5.Qd3 e5 6.dxe5 Qa5+ 7.Bd2 Qxe5 8.O-O-O Nxe4 9.Qd8+ Kxd8 10.Bg5+ Kc7 11.Bd8# 1-0',
      eco: 'B15',
      themes: 'sacrifice,mate,queenSacrifice,miniature',
      difficulty: 3,
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
