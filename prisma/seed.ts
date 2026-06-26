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

Knights are the slow, sneaky cousins of long-range pieces. Their gift is the **fork**: two attacks at once, with nothing able to block.`,
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

When you trade a bishop, ask: *will my remaining bishop have open diagonals, or will my pawns block it?* Good bishops win games; bad bishops watch from the sidelines.`,
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

A rook in the opening is shy and clumsy. A rook in the endgame, on an open file, is the boss of the board.`,
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

Treat your queen like a sports car: amazing once the road is clear, but don't drive it into traffic on move three.`,
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

The king has two lives: a frightened civilian in the opening, a brave general in the endgame.`,
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

## Your turn — find the knight fork

\`\`\`chess
mode: interactive
fen: 4r1k1/8/8/3N4/8/8/8/4K3 w - - 0 1
caption: Move the knight to a square that attacks both the king and the rook.
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
fen: r2qkbnr/ppp2ppp/2np4/1B2p1B1/4P3/2N5/PPPP1PPP/R2QK1NR w KQkq - 0 1
caption: The c6-knight is pinned and overloaded. White plays Nd5 — adding another attacker to win the piece.
\`\`\`

Once a piece is pinned, **attack it** with more pieces than it has defenders. The pin is the immobilizer; the pile-up is the winner.

## Try a pin yourself

\`\`\`chess
mode: interactive
fen: r3k2r/ppp2ppp/8/8/8/8/PPP2PPP/R2QK2R w KQkq - 0 1
caption: Play Qd8 — pinning the king to the back rank (a relative pin). Black can't run.
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

## Spot the skewer

\`\`\`chess
mode: interactive
fen: 6k1/8/8/8/8/2r5/4B3/4K3 w - - 0 1
caption: Move the bishop to skewer the king and the c3-rook.
\`\`\`

(Look for a diagonal that goes through the king and onto the rook.)

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

\`\`\`chess
mode: interactive
fen: 4k3/8/8/3n4/3R4/8/8/4K3 w - - 0 1
caption: Imagine moving the d4-rook — but wait, your own knight blocks the file too. Discovered attacks need a piece you can move OUT of the line.
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
fen: 2r3k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1
caption: The c8-rook is loose. Find a queen move that checks AND attacks it.
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

## A defender of the king

\`\`\`chess
mode: interactive
fen: 6k1/5pp1/7p/8/8/8/5P1P/3R2K1 w - - 0 1
caption: Black's king has only two pawn defenders. If you could trade off f7, the back rank opens up.
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
caption: Play Qc8 — mate. Same idea with a queen instead of a rook.
\`\`\`

## Make "luft" before it's too late

A tiny pawn move — **h3** or **g3** — gives your king an escape hatch. Without it, you're one tempo from disaster.

\`\`\`chess
mode: animate
fen: 6k1/5pp1/7p/8/8/8/8/R5K1 w - - 0 1
moves: Ra8+ Kh7
caption: Now Ra8 is just check, not mate — the king escapes to h7 thanks to ...h6.
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

## Watch out — and dodge!

\`\`\`chess
mode: interactive
fen: 8/R7/8/3k4/8/8/1R6/7K w - - 0 1
caption: If the king ever marches toward your rook, slide that rook FAR away along its rank. Never get close enough to be captured.
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

## Spot the pattern yourself

\`\`\`chess
mode: interactive
fen: 5rk1/6pp/8/8/4N3/8/8/6K1 w - - 0 1
caption: Where can the knight land to deliver a smothered-style attack? (Look for a square that gives check while the king is hemmed in by its own pieces.)
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

## Try it

\`\`\`chess
mode: interactive
fen: 6k1/8/5N2/8/8/8/8/R6K w - - 0 1
caption: The king is on g8 — almost in the corner. Push the rook to a8 to deliver an Arabian-style mate.
\`\`\`

(Hint: Ra8+ — the king must go to h7, and the knight will tighten the noose.)`,
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
fen: rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQ1RK1 b kq - 1 5
caption: Your turn — castle kingside (O-O) by dragging the king two squares right.
\`\`\`

## The five rules of castling

1. King hasn't moved ✓
2. That rook hasn't moved ✓
3. Squares between are empty ✓
4. King isn't in check right now ✓
5. King doesn't pass through (or land on) an attacked square ✓

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

## Try it yourself

\`\`\`chess
mode: interactive
fen: 4k3/2p5/8/3P4/8/8/8/4K3 b - - 0 1
caption: Play ...c5 (the two-square advance). White's d5-pawn can capture en passant with dxc6 on the very next move.
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
caption: Push the e-pawn to e8 and choose a queen. (You can promote even if you already have one.)
\`\`\`

## Underpromotion — choosing NOT a queen

Sometimes the queen is wrong. **Underpromote to a knight** when only a knight can give a key check or fork. **Underpromote to a rook** when promoting to a queen would stalemate the enemy king.

\`\`\`chess
mode: animate
fen: 4k3/3P4/8/8/8/8/8/4K3 w - - 0 1
moves: d8=N+
caption: d8=N+ — underpromote to a knight, delivering check and forking the king. A queen on d8 wouldn't even give check!
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
fen: 7k/8/6K1/8/8/8/8/5Q2 w - - 0 1
caption: Same position. Try Qf6 instead — Black still has a legal move (...Kg8 or ...Kh7). Bring your king up first, THEN mate.
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
fen: 8/8/8/8/8/8/8/4K2k w - - 0 1
caption: Files (columns) are a–h. Ranks (rows) are 1–8. White's king is on e1; Black's is on h1.
\`\`\`

## Try writing a move

\`\`\`chess
mode: interactive
fen: 4k3/8/8/8/8/5N2/8/4K3 w - - 0 1
caption: Drag the knight to e5. In notation that's "Ne5" — knight to e5.
\`\`\`

## The whole notation cheat sheet

- **Pieces:** K K**N**ight Q R B  *(pawns have no letter — just the square: "e4")*
- **Capture:** Bxe5 *(bishop takes on e5)*
- **Check:** + *(Nf6+)*  &nbsp; **Mate:** # *(Qxf7#)*
- **Castle:** O-O *(short)* &nbsp; O-O-O *(long)*
- **Promote:** e8=Q *(pawn to queen)*
- **Annotation:** ! good &nbsp; ? bad &nbsp; !! brilliant &nbsp; ?? blunder

## Read a real game

\`\`\`chess
mode: animate
moves: e4 e5 Nf3 Nc6 Bb5 a6
autoplay: true
caption: 1. e4 e5  2. Nf3 Nc6  3. Bb5 a6 — that's the Ruy Lopez opening, in just six symbols.
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
        {
          slug: 'queen-too-early',
          title: "Don't Bring the Queen Out Too Early",
          description: 'Why an early queen sortie hands your opponent free development',
          content: `# Don't Bring the Queen Out Too Early

It's tempting to unleash your most powerful piece immediately — but in the opening, an early queen is a **liability**.

## The Problem
Because the queen is so valuable, it must flee from any minor piece that attacks it. Your opponent develops knights and bishops **with tempo** — gaining time by hitting the queen — while you waste moves running away.

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e5 Qh5 Nc6 Bc4 g6 Qf3 Nf6
autoplay: true
caption: White's early queen is chased by ...g6 and Black develops freely while White shuffles.
\`\`\`

## The Principle
- Develop **knights and bishops first**, then castle
- Bring the queen out only when it has a safe, active square
- Count tempi: every move spent saving the queen is a move your opponent spends developing

## The Exception
A few openings deploy the queen early for a concrete reason (like the Scandinavian's ...Qxd5). Even then, the queen must have a plan to reach safety without losing time.`,
          order: 4,
          difficulty: 2,
          estimatedMinutes: 12,
        },
        {
          slug: 'opening-traps',
          title: 'Common Opening Traps',
          description: 'Recognize the quick tricks that catch unprepared players',
          content: `# Common Opening Traps

A trap is a move that sets a hidden threat, hoping the opponent walks into it. Knowing the famous ones means you'll **spring them — and never fall for them**.

## The Légal Trap
A queen sacrifice that leads to a smothered-style mate when Black pins the f3-knight with ...Bg4 and then grabs material too greedily.

## The Fried Liver Attack
After 1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.Ng5 d5 5.exd5 Nxd5?!, White plays **6.Nxf7!?**, dragging the king out for a fierce attack.

## The Englund Gambit Trap
A swindle for Black after 1.d4 e5 that punishes a greedy White who grabs too many pawns and gets mated on the back rank.

## How to Avoid Traps
1. **Develop soundly** — most traps punish greed or neglected development
2. Before grabbing a free pawn or piece, ask **"why is this offered?"**
3. Watch your **f2/f7** square and your back rank
4. When something looks too good to be true in the opening, look twice`,
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
        {
          slug: 'the-opposition',
          title: 'The Opposition',
          description: 'The king battle that decides countless pawn endgames',
          content: `# The Opposition

In king-and-pawn endgames, the kings fight a silent duel. The key weapon is **the opposition**.

## What It Is
The kings stand on the same file (or rank) with **one square between them**. Whoever does **not** have to move "has the opposition" — the other king must give way.

\`\`\`chess
mode: interactive
fen: 4k3/8/4K3/8/8/8/8/8 w - - 0 1
caption: The kings face off with one square between them. Whoever must move has to step aside.
\`\`\`

## Why It Matters
The side with the opposition can force the enemy king backward, clearing a path for a pawn to advance toward promotion. Losing the opposition often means losing the game — or only drawing a winning position.

## Types of Opposition
- **Direct opposition:** kings one square apart on the same line
- **Distant opposition:** an odd number of squares apart on the same line — the same battle, fought from afar
- **Diagonal opposition:** the kings oppose along a diagonal

## The Practical Rule
To win with a pawn, get your **king in front of the pawn** with the opposition. Then you can shoulder the enemy king aside and escort the pawn home.`,
          order: 3,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'passed-pawns',
          title: 'Passed Pawns',
          description: 'The runaway pawns that decide endgames',
          content: `# Passed Pawns

A **passed pawn** is one with no enemy pawns in front of it on its own file or the adjacent files — nothing can stop it from advancing except enemy pieces.

\`\`\`chess
mode: animate
fen: 8/2P5/8/8/8/8/k7/2K5 w - - 0 1
moves: c8=Q
autoplay: true
caption: Nothing can catch the c-pawn — it marches in and promotes to a queen.
\`\`\`

## Why They're Powerful
- They tie down enemy pieces, which must babysit the promotion square
- In the endgame, a passed pawn is often worth more than its single-pawn value
- A **protected passed pawn** (defended by another pawn) is especially strong

## Famous Advice
- *"Passed pawns must be pushed!"* — advance them to cramp the enemy
- *"Rooks belong behind passed pawns"* — both yours and your opponent's
- An **outside passed pawn** (far from the kings) is a winning trump: it lures the enemy king away while yours feasts elsewhere

## The Rule of the Square
To know if a lone king can catch a passed pawn, picture the square from the pawn to its promotion square. If the king can step inside that square, it stops the pawn; if not, the pawn queens.`,
          order: 4,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'two-bishop-mate',
          title: 'Two-Bishop Checkmate',
          description: 'Force mate in the corner with the bishop pair and your king',
          content: `# Two-Bishop Checkmate

King and **two bishops** versus a lone king is a forced win. The bishops sweep parallel diagonals to herd the king into a corner.

## The Technique
1. Use the bishops to build a **barrier** of diagonals the king cannot cross
2. Bring your king up to take away escape squares
3. Drive the enemy king to **any corner** (unlike the bishop-and-knight mate, any corner works)
4. Deliver mate with one bishop checking and the other (plus your king) sealing the escape

\`\`\`chess
mode: animate
fen: 7k/8/6K1/3B4/8/8/8/2B5 w - - 0 1
moves: Bb2#
caption: Bb2 checks along the long diagonal; the d5-bishop covers g8 and the king seals the rest — mate.
\`\`\`

## Key Tips
- Keep the bishops **side by side** on adjacent diagonals to form a moving wall
- The king does the herding; the bishops do the cutting
- Watch for stalemate as the enemy king nears the corner — leave it a square until the mating move`,
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

Pawns move slowly and can't go backward, so the pawn structure is the most **permanent** feature of a position. It dictates where your pieces belong and where the weaknesses lie.

## Pawn Weaknesses
- **Isolated pawn:** no friendly pawn on an adjacent file — it can't be defended by a pawn and the square in front is a great blockade post
- **Doubled pawns:** two pawns on the same file — they can't defend each other and one may become weak
- **Backward pawn:** a pawn left behind its neighbors, unable to advance safely; the square in front is an outpost for the enemy

## Pawn Strengths
- **Pawn chain:** a diagonal line of pawns defending each other — attack it at the **base**
- **Pawn majority:** more pawns than the opponent on one wing can create a passed pawn
- **Connected pawns:** side-by-side pawns that support each other's advance

## The Big Idea
Don't move pawns carelessly — each push leaves squares behind it permanently weak. Ask whether a pawn move improves your structure or creates a hole.`,
          order: 1,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'open-files-and-rooks',
          title: 'Open Files & Rook Power',
          description: 'Put your rooks where they dominate — on open lines',
          content: `# Open Files & Rook Power

Rooks are clumsy in the opening but become monsters once lines open. Their natural habitat is the **open file**.

## Files Explained
- **Open file:** no pawns of either color — a highway for your rook
- **Half-open file:** no pawns of *your* color; aim the rook at the enemy pawn that remains
- **Closed file:** blocked by pawns — no work for a rook here

## Rook Principles
1. **Seize open files** before your opponent — a rook on an open file controls the whole board
2. **Double your rooks** (stack them on the same file) to multiply the pressure
3. Aim for the **7th rank** — a rook there attacks pawns and pins the king to the back

\`\`\`chess
mode: interactive
fen: 3r2k1/pp3ppp/8/8/8/8/PP3PPP/3R2K1 w - - 0 1
caption: The d-file is wide open — both sides fight to own it with their rook.
\`\`\`

## Connected Rooks
Once your back rank is cleared of minor pieces and the king has castled, your rooks defend each other — "connected" rooks are a sign your development is complete.`,
          order: 2,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'outposts',
          title: 'Outposts',
          description: 'Plant a knight on a protected square deep in enemy territory',
          content: `# Outposts

An **outpost** is a square — usually on the 4th, 5th, or 6th rank — that an enemy pawn can never attack, protected by one of your own pawns. A knight parked there is worth its weight in gold.

## What Makes a Good Outpost
- It **cannot be challenged by a pawn** (no enemy pawn can advance to hit it)
- It is **defended by your pawn**, so trading it off costs the opponent a better piece
- It sits **near the enemy camp**, cramping their position

\`\`\`chess
mode: interactive
fen: r2q1rk1/pp3ppp/2n1p3/2Np4/3P4/2P5/PP3PPP/R2Q1RK1 w - - 0 1
caption: The knight on c5 is a dream outpost — no black pawn can ever drive it away.
\`\`\`

## Knights Love Outposts
A knight is short-ranged, so a permanent advanced home transforms it into a dominant piece. Bishops and rooks also enjoy outposts, but the **knight on a central outpost** is the classic positional trophy.

## Creating Them
Look for holes in the enemy structure — squares they weakened by pushing pawns — and maneuver a knight toward them, supported by a pawn.`,
          order: 3,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'good-and-bad-bishops',
          title: 'Good & Bad Bishops',
          description: 'Why some bishops shine and others bite on granite',
          content: `# Good & Bad Bishops

A bishop is only as good as the diagonals it can use. Your **pawn structure** decides whether a bishop is a hero or a spectator.

## The Definitions
- **Bad bishop:** blocked by your **own** pawns fixed on its color — it stares at its own wall
- **Good bishop:** free of such pawns, with open diagonals to roam

## How to Handle Each
- If you have a **bad bishop**, try to **trade it off** or get its pawns off its color
- Place **your pawns on the opposite color** of your remaining bishop so it stays active
- A bad bishop can become "good" if you can free it — sometimes a single pawn break does it

## The Bishop Pair
Holding **both bishops** while the opponent has given one up is a lasting edge, especially in open positions: together the bishops cover both square colors and dominate long diagonals.

## Practical Tip
Before trading a bishop for a knight, ask whether your remaining bishop will be good or bad given the pawn structure to come.`,
          order: 4,
          difficulty: 3,
          estimatedMinutes: 18,
        },
        {
          slug: 'space-advantage',
          title: 'Space Advantage',
          description: 'Use advanced pawns to cramp your opponent and maneuver freely',
          content: `# Space Advantage

**Space** is the territory your pawns control. The side with more space can shuffle pieces behind the lines while the opponent stumbles over each other in a cramped camp.

## How Space Is Gained
- Advanced pawns (like a chain on e5/d4) push the enemy back and seize squares
- The more rows your pawns control, the more room your pieces have to maneuver

## Using a Space Edge
1. **Avoid trades** — exchanges relieve the cramped side; keep pieces on to highlight their lack of room
2. **Maneuver on the side where you have more space**, switching the attack from wing to wing faster than the opponent can react
3. Use the extra room to **reroute knights** to strong squares

## The Counterplay
The cramped side has a clear plan too:
- **Trade pieces** to gain breathing room
- Strike at the **base of the pawn chain** with a timely pawn break (like ...c5 or ...f6) to challenge the space

## The Balance
Space is an asset, not a guarantee. Over-extend and those advanced pawns become weaknesses. Hold the space *and* keep the pawns defensible.`,
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

A *zwischenzug* (German for "in-between move") is a surprise interjection: instead of making the move your opponent expects — usually a recapture — you slip in a more forcing move first.

## The Idea
1. Your opponent plays a capture, expecting you to recapture automatically
2. Instead you play an **even more forcing move** — usually a check or a bigger threat
3. The opponent must answer it; *then* you carry out your original recapture, having gained something extra

## Why It Works
Recaptures feel automatic, so they are easy to assume. But a check or a mate threat is **more forcing** than a recapture — it jumps the queue. Squeezing one in can win a tempo, an extra pawn, or a whole piece.

## How to Spot One
Before you recapture, always ask: *"Do I have a check or a bigger threat first?"* The in-between move is one of the most overlooked resources in chess — and one of the most common ways strong players win material.

## A Cousin: The Desperado
When a piece is doomed anyway, it can grab material on its way out — a "desperado." That's a close relative of the zwischenzug, covered in its own lesson.`,
          order: 1,
          difficulty: 4,
          estimatedMinutes: 15,
        },
        {
          slug: 'the-windmill',
          title: 'The Windmill',
          description: 'A see-saw of discovered checks that strips the board bare',
          content: `# The Windmill

The windmill (or "see-saw") is one of the most spectacular tactics: a rook and bishop combine to deliver a **repeating cycle of discovered checks**, harvesting enemy material on every turn.

## How It Works
- A bishop aims at the enemy king along a long diagonal
- A rook sits on that diagonal, blocking the check
- The rook swings away **with check from the bishop**, grabs a piece, then returns **with a rook check**
- The enemy king shuffles back and forth, helpless, while you gobble everything in reach

\`\`\`chess
mode: animate
fen: 7k/ppp3Rp/8/8/8/8/1B3PPP/6K1 w - - 0 1
moves: Rxc7+ Kg8 Rg7+ Kh8 Rxb7+ Kg8 Rg7+ Kh8 Rxa7+ Kg8 Rg7+ Kh8
autoplay: true
caption: The see-saw: each time the rook leaves g7 the bishop checks, so the rook devours the 7th rank.
\`\`\`

## The Famous Example
The most celebrated windmill is **Carlos Torre vs. Emanuel Lasker, Moscow 1925**, where Torre's rook scythed through Black's position before returning to win the queen.

## The Requirements
1. A bishop with a clear diagonal to the enemy king
2. A rook that can alternate between blocking that diagonal (with check) and capturing
3. An enemy king with only one shuffle square to bounce between`,
          order: 2,
          difficulty: 5,
          estimatedMinutes: 18,
        },
        {
          slug: 'clearance-sacrifice',
          title: 'Clearance Sacrifice',
          description: 'Vacate a square or line — even by giving up material — to let another piece through',
          content: `# Clearance Sacrifice

Sometimes the piece in your way is *your own*. A **clearance sacrifice** gives up material to vacate a key square, file, or diagonal so another piece can deliver the decisive blow.

## The Concept
- You have a powerful threat — but one of your own pieces (or pawns) blocks the path
- You **clear the obstruction**, often by sacrificing it with a forcing move
- The line opens, and your follow-up wins

## Two Flavors
- **Line clearance:** open a rank, file, or diagonal for a queen, rook, or bishop
- **Square clearance:** vacate a square so a knight or other piece can land on it with decisive effect

## How to Find It
When you see a crushing move that's *almost* possible — blocked only by your own unit — look for a forcing way to get that unit out of the way **with tempo**. The opponent must respond to the threat, and your real idea lands the next move.

## The Key Principle
A clearance sacrifice trades **material for time and access**. It only works if the opened line leads to something bigger than what you gave up — so calculate the follow-up to the end.`,
          order: 3,
          difficulty: 5,
          estimatedMinutes: 15,
        },
        {
          slug: 'interference',
          title: 'Interference',
          description: 'Cut the line between an enemy piece and what it defends',
          content: `# Interference

Interference (sometimes called *obstruction* or a *Novotny*) is the rare and beautiful idea of **planting a piece between an enemy piece and the square it guards** — breaking the defensive connection.

## The Concept
- An enemy piece defends a key square or another piece along a line
- You interpose a unit **on that line**, often as a sacrifice
- The defender is suddenly cut off, and the undefended target falls

## The Novotny
The classic version drops a piece on a square where **two** enemy line-pieces cross. Whichever one captures it, it blocks the other — so a single sacrifice severs two defenses at once.

## Why It's Hard to Spot
We instinctively look for captures and checks, not for **quiet interpositions** on empty squares. Interference often involves placing a piece *en prise* in the middle of the board, which looks absurd until you see the point.

## How to Hunt for It
Identify the enemy piece doing the defending and the **line** it works along. Then ask whether you can drop something onto that line to break the connection — even at the cost of material.`,
          order: 4,
          difficulty: 5,
          estimatedMinutes: 15,
        },
        {
          slug: 'desperado',
          title: 'The Desperado',
          description: 'A doomed piece sells itself as dearly as possible',
          content: `# The Desperado

A *desperado* is a piece that is **going to be lost anyway**, so it grabs as much material as it can — or forces a favorable trade — before it disappears.

## Two Situations
- **A trapped piece:** your piece can't escape capture, so it captures something on its way out, getting *value* for itself instead of nothing
- **Mutual captures:** when several pieces hang at once, the side to move can have its doomed piece take an extra pawn or piece before the recaptures settle

## The Mindset
When you realize a piece is lost, don't just give it up. Ask: *"What can it take or accomplish before it dies?"* A knight that's about to be captured might snap off a central pawn; a rook caught in a trade might grab a defender first.

## Defensive Desperado
The idea also saves half-points: a piece about to be lost can sometimes force a **perpetual check** or a drawing simplification by throwing itself at the enemy king.

## The Lesson
No piece should die for free. Squeeze every last bit of value out of a doomed unit — that's the desperado.`,
          order: 5,
          difficulty: 4,
          estimatedMinutes: 15,
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
        {
          slug: 'french-defense',
          title: 'French Defense',
          description: 'A solid, counterattacking answer to 1.e4',
          content: `# The French Defense

A rock-solid choice for Black that invites White to build a big center — then attacks it.

## Starting Moves
1. e4 e6
2. d4 d5

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 e6 d4 d5 Nc3 Bb4 e5 c5
autoplay: true
caption: The Winawer French: Black pins the knight and strikes the center with ...c5.
\`\`\`

## The Trade-Off
- Black gets a **solid, durable** structure that's hard to break down
- The downside: the **light-squared bishop** on c8 can become "bad," hemmed in by the e6-pawn
- Black's standard plan is the pawn break **...c5**, hitting White's d4

## Main Variations
- **Advance** (3.e5) — White grabs space; Black undermines with ...c5 and ...f6
- **Winawer** (3.Nc3 Bb4) — sharp and double-edged
- **Tarrasch** (3.Nd2) — a flexible, low-risk try for White
- **Exchange** (3.exd5) — symmetrical and quiet`,
          order: 5,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'caro-kann',
          title: 'Caro-Kann Defense',
          description: 'Solid like the French, but with a free light-squared bishop',
          content: `# The Caro-Kann Defense

A favorite of positional players: as solid as the French, but Black develops the light-squared bishop *before* locking it in.

## Starting Moves
1. e4 c6
2. d4 d5

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5
autoplay: true
caption: The Classical Caro-Kann: Black trades on e4 and develops the bishop actively to f5.
\`\`\`

## Why Play It
- A **sound, reliable** structure with few weaknesses
- Unlike the French, the **c8-bishop gets out** to f5 or g4 before ...e6
- Leads to slightly better endgames for Black thanks to a healthy pawn structure

## Main Variations
- **Classical** (4...Bf5) — the principled main line
- **Advance** (3.e5) — White gains space; Black plays ...Bf5 and ...e6
- **Exchange / Panov** (3.exd5) — can become a sharp IQP middlegame after c4`,
          order: 6,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'english-opening',
          title: 'English Opening',
          description: 'A flexible flank opening that fights for the center from the side',
          content: `# The English Opening

1.c4 — a flexible, strategic opening favored by players who like to control the center from the flank before committing pawns.

## Starting Move
1. c4 (staking a claim on d5 from the side)

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: c4 e5 Nc3 Nf6 Nf3 Nc6 g3 d5 cxd5 Nxd5
autoplay: true
caption: A Reversed Sicilian: White plays the Sicilian setup a move up, fianchettoing on g3.
\`\`\`

## Why Play It
- **Flexible** — it can transpose into many other openings (Queen's Gambit, Catalan, even Sicilian structures)
- Avoids heavily-analyzed 1.e4 and 1.d4 main lines
- Emphasizes **piece play and the long diagonal** after a kingside fianchetto

## Common Setups
- **Reversed Sicilian** (1...e5) — White plays the Sicilian a tempo up
- **Symmetrical** (1...c5) — both sides mirror each other
- **King's English** with g3, Bg2, and pressure down the long diagonal`,
          order: 7,
          difficulty: 4,
          estimatedMinutes: 22,
        },
        {
          slug: 'london-system',
          title: 'London System',
          description: 'An easy-to-learn setup you can play against almost anything',
          content: `# The London System

A low-maintenance, solid system: White develops the same way against almost any Black setup, making it ideal for club players.

## The Setup
1. d4 followed by Bf4, e3, Nf3, Bd3, c3, and Nbd2

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 d5 Nf3 Nf6 Bf4 e6 e3 Bd6 Bg3
autoplay: true
caption: The London System: the dark-squared bishop comes out early to f4 before e3 locks it in.
\`\`\`

## Why It's Popular
- **Easy to learn** — one harmonious setup against most defenses
- The key move is getting the **dark-squared bishop outside the pawn chain** (to f4) before playing e3
- Solid and hard to crack, with a typical plan of Ne5, f4, and a kingside push

## Things to Watch
- Don't get *too* routine — Black can challenge with ...c5 and ...Qb6 hitting b2 and d4
- It's safe but can be a little passive; learn the standard attacking plan with Ne5 to inject life`,
          order: 8,
          difficulty: 3,
          estimatedMinutes: 22,
        },
        {
          slug: 'kings-indian-defense',
          title: "King's Indian Defense",
          description: 'Let White build a big center — then blow it up with a kingside attack',
          content: `# The King's Indian Defense

A fighting, hypermodern defense: Black lets White occupy the center, then strikes back with pieces and a ferocious kingside pawn storm.

## Starting Moves
1. d4 Nf6
2. c4 g6
3. Nc3 Bg7

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O
autoplay: true
caption: The King's Indian: Black fianchettoes, castles, and prepares to challenge the center with ...e5.
\`\`\`

## The Plan
- Black allows White a broad pawn center (d4 + e4) on purpose
- The fianchettoed **g7-bishop** rakes the long diagonal
- Black strikes with **...e5** (or ...c5); in the main lines the center locks and Black launches **...f5–f4–g5–g4**, storming White's king

## The Trade-Off
A double-edged race: White attacks on the **queenside**, Black on the **kingside**. It's not for the faint-hearted — but few openings give Black such rich winning chances.`,
          order: 9,
          difficulty: 4,
          estimatedMinutes: 25,
        },
        {
          slug: 'scandinavian-defense',
          title: 'Scandinavian Defense',
          description: 'Challenge the e4-pawn immediately with 1...d5',
          content: `# The Scandinavian Defense

Also called the Center Counter, the Scandinavian challenges White's e-pawn on move one — direct, easy to learn, and surprisingly solid.

## Starting Moves
1. e4 d5
2. exd5 Qxd5
3. Nc3 (gaining time on the queen)

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6
autoplay: true
caption: The Scandinavian: Black recaptures on d5, and after Nc3 the queen retreats to a5.
\`\`\`

## The Ideas
- Black gets a **clear, sturdy structure** with few opening traps to memorize
- The early queen recapture costs a little time (White develops with tempo via Nc3), but the queen settles safely on a5 or d6
- A reliable practical weapon, especially for players who want to sidestep heavy theory

## Modern Lines
- **3...Qa5** — the classic retreat
- **3...Qd6** — flexible and increasingly popular
- The **gambit** 2...Nf6 (delaying the recapture) leads to sharper play`,
          order: 10,
          difficulty: 3,
          estimatedMinutes: 22,
        },
        {
          slug: 'nimzo-indian-defense',
          title: 'Nimzo-Indian Defense',
          description: "Pin the knight and play against White's pawn structure",
          content: `# The Nimzo-Indian Defense

One of the most respected defenses to 1.d4. Black pins White's knight and is happy to trade the bishop for it, inflicting long-term structural damage.

## Starting Moves
1. d4 Nf6
2. c4 e6
3. Nc3 Bb4 (the pin that defines the opening)

\`\`\`chess
mode: animate
fen: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
moves: d4 Nf6 c4 e6 Nc3 Bb4
autoplay: true
caption: The Nimzo-Indian: Black pins the c3-knight, ready to trade it and damage White's pawns.
\`\`\`

## The Strategy
- By playing **...Bxc3**, Black gives up the bishop pair to **double White's c-pawns**, creating a lasting structural target
- Black then blockades the doubled pawns and plays against them
- It's a battle of **bishop pair vs. pawn structure** — a deeply strategic, world-championship-level opening

## Why It's Respected
The Nimzo is flexible, sound, and scores well at every level. Many champions have made it the cornerstone of their defense against 1.d4.`,
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

The most famous attacking pattern in chess: sacrifice a bishop on **h7** (or h2 for Black) to rip open the castled king.

## The Idea
With a bishop on d3, a knight ready for g5, and the queen able to reach the h-file, White crashes through:

\`\`\`chess
mode: animate
fen: r1bq1rk1/ppp2ppp/2n2n2/3p4/3P4/2NB1N2/PPP2PPP/R1BQ1RK1 w - - 0 1
moves: Bxh7+ Kxh7 Ng5+ Kg8 Qh5
autoplay: true
caption: Bxh7+! drags the king out, Ng5+ leaps in, and Qh5 threatens the unstoppable Qh7#.
\`\`\`

## The Three Ingredients
1. A **bishop** aimed at h7 (on the b1–h7 diagonal)
2. A **knight** that can jump to g5 with check
3. A **queen** with a fast route to the h-file (often via h5 or d1–h5)

## When It Works
- Black's **h7 is defended only by the king**
- Black has no knight on f6 to cover h5/h7
- White can bring up enough force before Black consolidates

## When to Hold Back
If Black can answer ...Kg6 safely, or has ...Nf6 covering the key squares, the sacrifice may fizzle. **Calculate to mate or a clear material gain before committing.**`,
          order: 1,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'pawn-storms',
          title: 'Pawn Storms',
          description: 'March your pawns at the enemy king to tear open lines',
          content: `# Pawn Storms

When the kings have castled on **opposite sides**, the game becomes a race: throw your pawns at the enemy king while keeping your own safe.

## The Concept
- Pawns in front of *your* king should usually stay put (they're the shelter)
- Pawns in front of the *enemy* king are your battering ram — push them forward to **open files** for your rooks and queen

## Opposite-Side Castling
This is the classic pawn-storm scenario:
- You castle queenside, opponent castles kingside (or vice versa)
- Both sides hurl their pawns at the other's king — **speed is everything**
- Whoever opens lines and lands the attack first usually wins

## Keys to a Successful Storm
1. **Don't worry about your own structure** near the enemy king — you want to open it, even by sacrifice
2. **Open at least one file** for a rook; a closed storm achieves nothing
3. **Count the race** — if both attacks crash through, the faster one wins, so calculate tempo carefully

## Same-Side Castling Caution
With kings on the same side, storming your own king's pawns is dangerous — it exposes *you*. Pawn storms are mainly a tool when the kings live on opposite wings.`,
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

The single most important winning technique in rook endgames. If you have a rook and a pawn on the 7th rank, your king in front of it, and the enemy king cut off — this is how you win.

\`\`\`chess
mode: interactive
fen: 1K6/1P6/8/8/8/8/r7/2R3k1 w - - 0 1
caption: A Lucena setup: White's king shelters the pawn while the rook prepares to escape the checks.
\`\`\`

## The Problem
Your king stands in front of its own pawn, but the moment it steps aside to let the pawn queen, enemy rook checks drive it away. You need a way to **shield the king** from those checks.

## Building a Bridge
1. Advance your **rook to the fourth rank** (counting from your side), e.g. Rc4
2. Step the king out toward the rook's file
3. When the checks come, **interpose your rook** — the "bridge" — to block the check
4. The king reaches safety and the pawn promotes

## The Key Idea
The rook on the fourth rank is the bridge: it cuts the distance the checking rook can harass you, then blocks the final check. Memorize this — it converts countless "drawn-looking" rook endings into wins.`,
          order: 1,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'philidor-position',
          title: 'The Philidor Position',
          description: 'The fundamental drawing method when defending rook endgames',
          content: `# The Philidor Position

The defender's best friend. When your opponent has a rook and a pawn and you have only a rook, the Philidor technique holds the draw.

\`\`\`chess
mode: interactive
fen: 8/8/4k3/8/4P3/r7/4K3/4R3 b - - 0 1
caption: The Philidor draw: Black keeps the rook on the third rank to deny the enemy king a path forward.
\`\`\`

## The Technique (Two Phases)
1. **Third-rank defense:** as long as the pawn has not yet reached its 6th rank, park your rook on **your third rank** (the rank in front of the pawn's advance). This stops the enemy king from supporting the pawn.
2. **Switch to the rear:** the moment the pawn advances to your third rank, swing your rook to the **back rank** and check the enemy king from behind. With the king unable to hide from the checks, it's a draw.

## Why It Works
The attacking side wins only if its **king** can shepherd the pawn forward. The third-rank rook makes that impossible; once the pawn over-extends, the checks from behind are endless.

## The Lesson
Lucena wins, Philidor draws. Knowing which position you're heading for — and how to reach it — is what separates a held draw from a lost point.`,
          order: 2,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'bishop-knight-mate',
          title: 'Bishop & Knight Checkmate',
          description: 'The hardest basic mate — driving the king to the right corner',
          content: `# Bishop & Knight Checkmate

King, bishop, and knight versus a lone king is a **forced win**, but the trickiest of the basic mates. The catch: you can only mate in a corner **the same color as your bishop**.

\`\`\`chess
mode: interactive
fen: 8/8/8/8/8/2N5/3BK3/7k w - - 0 1
caption: K+B+N vs K: drive the lone king toward a corner the bishop controls to deliver mate.
\`\`\`

## Why It's Hard
- The mate **only** works in the two corners your bishop can reach
- You must first drive the king to *any* edge, then herd it along to the **correct** corner
- The clock matters: it can take up to 33 moves, and the fifty-move rule looms

## The Method
1. Force the enemy king to the edge of the board with king, bishop, and knight working together
2. If it's heading for the wrong corner, use the famous **"W-maneuver"** with the knight to shepherd it across to the right one
3. Coordinate all three pieces to deliver the final mate in the correct corner

## The Practical Tip
This mate is rare, but knowing it builds real piece-coordination skill. Practice the W-maneuver until the knight's path feels natural — it's the heart of the technique.`,
          order: 3,
          difficulty: 5,
          estimatedMinutes: 25,
        },
        {
          slug: 'wrong-bishop',
          title: 'The Wrong Bishop',
          description: 'When an extra bishop and a rook pawn still only draw',
          content: `# The Wrong Bishop

One of the great endgame surprises: a king, bishop, and **rook pawn** — material that *looks* winning — is only a **draw** if the bishop is the "wrong" one.

\`\`\`chess
mode: interactive
fen: 8/8/8/8/8/6b1/5k1p/7K w - - 0 1
caption: Wrong bishop: it can't control h1, so the cornered king is stalemated — a draw despite the extra piece.
\`\`\`

## The Rule
With a rook pawn (a- or h-file), the **promotion square is in the corner**. If your bishop does **not** control the color of that corner square, you can never drive the enemy king out of it:
- The defending king simply sits in the corner
- Approaching with your own king delivers **stalemate**, not mate

## The Telltale Check
For an h-pawn promoting on h8 (a light square), you need a **light-squared bishop**. A dark-squared bishop is the "wrong bishop" and the position is drawn.

## Why It Matters
- As the stronger side: **avoid trading into a wrong-bishop ending** — keep a pawn elsewhere or steer for a different bishop
- As the defender: when you're losing, **head for the wrong-bishop corner** — it's a lifeline that salvages a half point from a hopeless-looking game`,
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
