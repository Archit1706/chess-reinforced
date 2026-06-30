/**
 * Pure-JS fallback chess engine.
 *
 * Always-available fallback for when Stockfish isn't usable (worker blocked,
 * still loading, errored). Negamax + alpha-beta + iterative deepening, plus
 * the standard search optimizations that make a real difference at low depth:
 *   - **Quiescence search** at horizon nodes (extends captures + checks) so
 *     the engine doesn't blunder material to "horizon effect" tactics.
 *   - **MVV-LVA** capture ordering so big-prize captures with cheap attackers
 *     are searched first → tighter alpha-beta pruning.
 *   - **Killer-move heuristic** (2 slots per ply) and a **history table** so
 *     non-capturing moves that worked elsewhere bubble up.
 *   - **Transposition table** (bounded, LRU-ish) so repeated positions don't
 *     re-search from scratch.
 *
 * Strength is still scaled to the configured ELO (low ratings cap depth +
 * inject occasional random moves so the bot feels beatable). The pure-Stockfish
 * path is still preferred when available; this engine guarantees the computer
 * always replies.
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

/** Minimal verbose-move shape used internally (chess.js subset). */
interface VMove {
  from: string;
  to: string;
  promotion?: string;
  captured?: string;
  flags: string;
  piece: string;
  san: string;
}

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

// --- Search state ----------------------------------------------------------

const ABORT = Symbol('search-timeout');
const MAX_PLY = 64;

// Most Valuable Victim − Least Valuable Attacker. Captures are sorted by
// (10 * value-of-captured) − value-of-attacker, so QxP scores below PxQ.
function mvvLva(m: VMove): number {
  if (!m.captured) return 0;
  return 10 * PIECE_VALUE[m.captured] - PIECE_VALUE[m.piece];
}

let nodeCount = 0;
let deadline = 0;
// Killer-move slots per ply — two non-capturing moves that caused cutoffs.
const killers: Array<[string | null, string | null]> = [];
// History heuristic: success count per (from, to). Bounded by the search.
const history: Map<string, number> = new Map();

// Transposition table — bounded LRU-ish by clearing when oversized.
const TT_LIMIT = 1 << 16;
interface TTEntry {
  depth: number;
  score: number;
  flag: 'exact' | 'lower' | 'upper';
  best: string | null;
}
const tt: Map<string, TTEntry> = new Map();

function resetSearchState() {
  nodeCount = 0;
  killers.length = 0;
  for (let i = 0; i < MAX_PLY; i++) killers.push([null, null]);
  history.clear();
  if (tt.size > TT_LIMIT) tt.clear();
}

function moveKey(m: VMove): string {
  return m.from + m.to + (m.promotion ?? '');
}

/** Order moves: hash move, then captures (MVV-LVA), then killers, then history. */
function orderMoves(moves: VMove[], ply: number, hashMove: string | null): VMove[] {
  const [k1, k2] = killers[ply] ?? [null, null];
  return [...moves].sort((a, b) => scoreOf(b) - scoreOf(a));

  function scoreOf(m: VMove): number {
    const key = moveKey(m);
    if (hashMove && key === hashMove) return 1_000_000;
    if (m.captured) return 100_000 + mvvLva(m);
    if (key === k1) return 90_000;
    if (key === k2) return 80_000;
    return history.get(key) ?? 0;
  }
}

/** Quiescence search — extends only captures + promotions at the horizon.
 * Fail-soft: returns the discovered score, not the bound, so callers see real
 * values (important for accurate root-move selection). Depth-bounded. */
function quiesce(game: Chess, alpha: number, beta: number, qDepth: number): number {
  if ((++nodeCount & 1023) === 0 && Date.now() > deadline) throw ABORT;

  const standPat = (() => {
    const e = evaluate(game);
    return game.turn() === 'w' ? e : -e;
  })();

  let best = standPat;
  if (best >= beta) return best;
  if (best > alpha) alpha = best;
  if (qDepth <= 0) return best;

  const moves = game.moves({ verbose: true }) as VMove[];
  // Only loud moves: captures and promotions (no quiet checks — too expensive).
  const loud = moves.filter((m) => m.captured || (m.promotion && m.promotion !== 'k'));

  for (const m of loud.sort((a, b) => mvvLva(b) - mvvLva(a))) {
    game.move(m);
    const score = -quiesce(game, -beta, -alpha, qDepth - 1);
    game.undo();
    if (score > best) best = score;
    if (score >= beta) return score; // fail-soft: return the true score
    if (score > alpha) alpha = score;
  }
  return best;
}

function negamax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  ply: number
): number {
  if ((++nodeCount & 1023) === 0 && Date.now() > deadline) throw ABORT;

  if (game.isCheckmate()) return -MATE - depth; // prefer faster mates
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;

  // TT probe (uses the position-only part of FEN as the key).
  const ttKey = positionKey(game);
  const ttEntry = tt.get(ttKey);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'exact') return ttEntry.score;
    if (ttEntry.flag === 'lower' && ttEntry.score >= beta) return ttEntry.score;
    if (ttEntry.flag === 'upper' && ttEntry.score <= alpha) return ttEntry.score;
  }

  if (depth <= 0) return quiesce(game, alpha, beta, 6);

  const moves = game.moves({ verbose: true }) as VMove[];
  if (moves.length === 0) {
    return game.isCheck() ? -MATE - depth : 0;
  }

  const ordered = orderMoves(moves, ply, ttEntry?.best ?? null);
  const originalAlpha = alpha;

  let best = -Infinity;
  let bestMoveKey: string | null = null;

  for (const m of ordered) {
    game.move(m);
    const score = -negamax(game, depth - 1, -beta, -alpha, ply + 1);
    game.undo();

    if (score > best) {
      best = score;
      bestMoveKey = moveKey(m);
    }
    if (best > alpha) alpha = best;
    if (alpha >= beta) {
      // Beta cutoff. Promote a non-capturing move into the killer/history tables.
      if (!m.captured) {
        const key = moveKey(m);
        const slots = killers[ply] ?? [null, null];
        if (slots[0] !== key) {
          slots[1] = slots[0];
          slots[0] = key;
        }
        history.set(key, (history.get(key) ?? 0) + depth * depth);
      }
      break;
    }
  }

  // Store TT entry — but NOT mate scores (distance-to-mate doesn't transfer
  // correctly across positions without ply correction). Skipping is safer.
  if (Math.abs(best) < MATE - 10000) {
    const flag: TTEntry['flag'] =
      best <= originalAlpha ? 'upper' : best >= beta ? 'lower' : 'exact';
    tt.set(ttKey, { depth, score: best, flag, best: bestMoveKey });
  }

  return best;
}

/** Position-only TT key — strips the move-counter fields from a FEN. */
function positionKey(game: Chess): string {
  const parts = game.fen().split(' ');
  return parts.slice(0, 4).join(' ');
}

function settingsForElo(elo: number): {
  depth: number;
  blunderChance: number;
  budgetMs: number;
} {
  // Per-call time budget — high-ELO searches get a little more so the deeper
  // iterations have a chance to finish (quiescence + TT costs more per node).
  if (elo < 1000) return { depth: 1, blunderChance: 0.35, budgetMs: 400 };
  if (elo < 1400) return { depth: 2, blunderChance: 0.15, budgetMs: 600 };
  if (elo < 1800) return { depth: 3, blunderChance: 0.05, budgetMs: 800 };
  return { depth: 4, blunderChance: 0, budgetMs: 1200 };
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
  resetSearchState();
  try {
    return negamax(game, depth, -Infinity, Infinity, 0);
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
  const moves = game.moves({ verbose: true }) as VMove[];
  if (moves.length === 0) return null;

  const { depth: maxDepth, blunderChance, budgetMs } = settingsForElo(elo);

  if (Math.random() < blunderChance) {
    return toUci(moves[Math.floor(Math.random() * moves.length)]);
  }

  deadline = Date.now() + budgetMs;
  resetSearchState();

  let bestMove: VMove = moves[0];

  for (let d = 1; d <= maxDepth; d++) {
    try {
      const ordered = orderMoves(moves, 0, moveKey(bestMove));
      let alpha = -Infinity;
      let iterationBest = bestMove;
      let iterationScore = -Infinity;

      for (const m of ordered) {
        game.move(m);
        // Full window at the root — no alpha narrowing — so every move
        // returns its TRUE score instead of a bound. Critical for correct
        // root-move selection: a captured-queen and a king shuffle both
        // returning the cutoff value `100` would be a coin flip otherwise.
        const raw = -negamax(game, d - 1, -Infinity, Infinity, 1);
        game.undo();
        // Tie-break jitter (≤5 cp, never on mate scores) only for selection.
        const score = Math.abs(raw) > MATE - 10000 ? raw : raw + Math.random() * 5;
        if (score > iterationScore) {
          iterationScore = score;
          iterationBest = m;
        }
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
