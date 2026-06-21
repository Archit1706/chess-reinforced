/**
 * Pure-JS fallback chess engine.
 *
 * Stockfish loads from a CDN inside a Web Worker and needs cross-origin
 * isolation; when that fails (blocked CDN, COEP, slow network) the computer
 * opponent would never move. This dependency-free engine guarantees the
 * computer always replies. It's a small negamax + alpha-beta search over
 * chess.js move generation with material + piece-square evaluation, with
 * strength scaled to the configured ELO.
 */

import { Chess } from 'chess.js';

const MATE = 1_000_000;

const PIECE_VALUE: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Piece-square tables from White's perspective, a8 (index 0) → h1 (index 63).
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
};

/** Static evaluation from White's perspective (centipawns). */
function evaluate(game: Chess): number {
  const board = game.board(); // board[0] = rank 8 (a8..h8)
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board[r][f];
      if (!sq) continue;
      const idx = r * 8 + f; // a8 = 0
      const base = PIECE_VALUE[sq.type] + PST[sq.type][sq.color === 'w' ? idx : idx ^ 56];
      score += sq.color === 'w' ? base : -base;
    }
  }
  return score;
}

/** Captures first — cheap move ordering to help alpha-beta pruning. */
function orderMoves(moves: any[]): any[] {
  return [...moves].sort((a, b) => {
    const av = a.captured ? PIECE_VALUE[a.captured] : 0;
    const bv = b.captured ? PIECE_VALUE[b.captured] : 0;
    return bv - av;
  });
}

const ABORT = Symbol('search-timeout');
let nodeCount = 0;
let deadline = 0;

function negamax(game: Chess, depth: number, alpha: number, beta: number): number {
  if ((++nodeCount & 1023) === 0 && Date.now() > deadline) throw ABORT;
  if (game.isCheckmate()) return -MATE - depth; // prefer faster mates
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;
  if (depth === 0) {
    const e = evaluate(game);
    return game.turn() === 'w' ? e : -e;
  }

  let best = -Infinity;
  for (const m of orderMoves(game.moves({ verbose: true }) as any[])) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha);
    game.undo();
    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

function settingsForElo(elo: number): { depth: number; blunderChance: number } {
  if (elo < 1000) return { depth: 1, blunderChance: 0.35 };
  if (elo < 1400) return { depth: 2, blunderChance: 0.15 };
  if (elo < 1800) return { depth: 3, blunderChance: 0.05 };
  return { depth: 4, blunderChance: 0 };
}

function toUci(move: { from: string; to: string; promotion?: string }): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

/**
 * Static/shallow-search evaluation of a position, in centipawns from the side
 * to move's perspective (positive = side to move is better). Used as an offline
 * evaluator for post-game analysis when Stockfish isn't available.
 */
export function evaluateFen(fen: string, depth = 2): number {
  let game: Chess;
  try {
    game = new Chess(fen);
  } catch {
    return 0;
  }
  if (game.isCheckmate()) return -MATE;
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;

  deadline = Date.now() + 400;
  nodeCount = 0;
  try {
    return negamax(game, depth, -Infinity, Infinity);
  } catch {
    const e = evaluate(game);
    return game.turn() === 'w' ? e : -e;
  }
}

/**
 * Best move (UCI) for the side to move at `fen`, or null if there are none.
 * Uses iterative deepening under a ~700ms time budget (so the UI never blocks)
 * and scales strength with `elo`: lower ratings cap depth shallower and
 * occasionally play a random move so the bot feels beatable.
 */
export function getLocalBestMove(fen: string, elo = 1500): string | null {
  let game: Chess;
  try {
    game = new Chess(fen);
  } catch {
    return null;
  }
  const moves = game.moves({ verbose: true }) as any[];
  if (moves.length === 0) return null;

  const { depth: maxDepth, blunderChance } = settingsForElo(elo);

  if (Math.random() < blunderChance) {
    return toUci(moves[Math.floor(Math.random() * moves.length)]);
  }

  const ordered = orderMoves(moves);
  let bestMove = ordered[0];
  deadline = Date.now() + 700;
  nodeCount = 0;

  for (let d = 1; d <= maxDepth; d++) {
    try {
      // Search the previous iteration's best move first for better pruning.
      const rootMoves = [bestMove, ...ordered.filter((m) => m !== bestMove)];
      let alpha = -Infinity;
      let iterationBest = bestMove;
      let iterationScore = -Infinity;
      for (const m of rootMoves) {
        game.move(m);
        const raw = -negamax(game, d - 1, -Infinity, -alpha);
        game.undo();
        // Jitter only non-mate scores, so the fastest forced mate still wins.
        const score = Math.abs(raw) > MATE - 10000 ? raw : raw + Math.random() * 5;
        if (score > iterationScore) {
          iterationScore = score;
          iterationBest = m;
        }
        if (iterationScore > alpha) alpha = iterationScore;
      }
      bestMove = iterationBest; // only committed when the depth completes
    } catch (e) {
      if (e === ABORT) break;
      throw e;
    }
    if (Date.now() > deadline) break;
  }
  return toUci(bestMove);
}
