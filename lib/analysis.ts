/**
 * Post-game analysis.
 *
 * Replays a game, evaluates every position with Stockfish (at full strength),
 * and derives per-move centipawn loss, a Lichess-style classification, and an
 * accuracy score for each side.
 *
 * The scoring math is split into small pure functions and the engine call is
 * injected via the `evaluate` option, so the logic can be unit-tested without a
 * worker or network.
 */

import { Chess } from 'chess.js';
import type { Move } from 'chess.js';
import { analyzePosition, setLimitStrength, isEngineReady } from './stockfish';
import { evaluateFen } from './local-engine';
import { classifyMove } from './chess';
import type { AnalyzedMove, GameAnalysis, MoveClassification } from '@/types/chess';

/** Large finite centipawn stand-in for a forced mate, decaying with distance. */
const MATE_SCORE = 100_000;
const DEFAULT_DEPTH = 12;

/** Per-position evaluation, always from the side-to-move's perspective. */
export interface Evaluation {
  /** Centipawns for the side to move (positive = side to move is better). */
  cp: number;
  /** Engine's preferred move in UCI, if known. */
  bestMove?: string;
}

export type Evaluator = (fen: string, depth: number) => Promise<Evaluation>;

export interface AnalyzeOptions {
  depth?: number;
  /** Reports progress as positions are evaluated (1-based, inclusive of total). */
  onProgress?: (done: number, total: number) => void;
  /** Cooperative cancellation. */
  signal?: AbortSignal;
  /** Override the engine (used in tests). */
  evaluate?: Evaluator;
  /** Starting position; defaults to the standard initial position. */
  startFen?: string;
}

/** Collapse an engine score (cp or mate) into a single side-to-move centipawn value. */
export function normalizeScore(evaluation: number, mate?: number): number {
  if (mate != null) {
    // Closer mates score higher; sign follows who is mating.
    return mate > 0 ? MATE_SCORE - mate : -MATE_SCORE - mate;
  }
  return evaluation;
}

/** Win probability (0–100) for the side to move, given its centipawn score. */
export function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/**
 * Per-move accuracy (0–100) from the mover's win% before and after the move.
 * Mirrors Lichess's accuracy curve; a move that doesn't lose win% scores 100.
 */
export function accuracyFromWinPercents(before: number, after: number): number {
  if (after >= before) return 100;
  const acc = 103.1668 * Math.exp(-0.04354 * (before - after)) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Local (offline) evaluator — always available, no worker/network needed. */
const localEvaluator: Evaluator = async (fen) => ({ cp: evaluateFen(fen, 2) });

/**
 * Analyze a full game. `moves` is the verbose chess.js history (as stored in the
 * game store). Returns per-move classifications plus aggregate accuracy and
 * blunder/mistake/inaccuracy counts.
 *
 * Uses Stockfish only when it's already loaded (it is never awaited, so a
 * blocked CDN/worker can't hang the analysis); otherwise it evaluates with the
 * built-in local engine. Either way the analysis always completes.
 */
export async function analyzeGame(
  moves: Move[],
  options: AnalyzeOptions = {}
): Promise<GameAnalysis> {
  const depth = options.depth ?? DEFAULT_DEPTH;

  let evaluate = options.evaluate;
  let stockfish = false;
  if (!evaluate) {
    if (isEngineReady()) {
      stockfish = true;
      setLimitStrength(false); // analyse at full strength
      evaluate = async (fen, d) => {
        // Per-position timeout so a single stuck call falls back instead of hanging.
        let a: Awaited<ReturnType<typeof analyzePosition>> | null = null;
        try {
          a = await Promise.race([
            analyzePosition(fen, d, 1),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
          ]);
        } catch {
          a = null;
        }
        return a
          ? { cp: normalizeScore(a.evaluation, a.mate), bestMove: a.bestMove }
          : { cp: evaluateFen(fen, 2) };
      };
    } else {
      evaluate = localEvaluator;
    }
  }

  // Reconstruct the FEN after every ply (plus the starting position).
  const chess = options.startFen ? new Chess(options.startFen) : new Chess();
  const fens: string[] = [chess.fen()];
  for (const move of moves) {
    chess.move(move);
    fens.push(chess.fen());
  }

  // Evaluate each position once; loss for ply i uses evals[i] and evals[i+1].
  const evals: Evaluation[] = [];
  try {
    for (let i = 0; i < fens.length; i++) {
      if (options.signal?.aborted) throw new DOMException('Analysis aborted', 'AbortError');
      // Yield to the event loop so the progress bar repaints and the UI stays
      // responsive during the (synchronous) local evaluations.
      await new Promise((resolve) => setTimeout(resolve, 0));
      evals.push(await evaluate(fens[i], depth));
      options.onProgress?.(i + 1, fens.length);
    }
  } finally {
    if (stockfish) setLimitStrength(true); // restore playing strength
  }

  const analyzed: AnalyzedMove[] = [];
  const lossByColor: { white: number[]; black: number[] } = { white: [], black: [] };
  const accuracyByColor: { white: number[]; black: number[] } = { white: [], black: [] };
  let inaccuracies = 0;
  let mistakes = 0;
  let blunders = 0;

  for (let i = 0; i < moves.length; i++) {
    const moverIsWhite = i % 2 === 0;

    // Best the mover could get (side-to-move score before the move) vs. what the
    // move actually yielded (negate the opponent's score after the move).
    const before = evals[i].cp;
    const moverAfter = -evals[i + 1].cp;
    const centipawnLoss = Math.max(0, before - moverAfter);

    const classification = classifyMove(centipawnLoss) as MoveClassification;
    if (classification === 'inaccuracy') inaccuracies++;
    else if (classification === 'mistake') mistakes++;
    else if (classification === 'blunder') blunders++;

    const accuracy = accuracyFromWinPercents(winPercent(before), winPercent(moverAfter));

    if (moverIsWhite) {
      lossByColor.white.push(centipawnLoss);
      accuracyByColor.white.push(accuracy);
    } else {
      lossByColor.black.push(centipawnLoss);
      accuracyByColor.black.push(accuracy);
    }

    // Store the eval after the move from White's perspective for an eval graph.
    const afterFenWhiteToMove = fens[i + 1].includes(' w ');
    const evaluationWhitePov = afterFenWhiteToMove ? evals[i + 1].cp : -evals[i + 1].cp;

    analyzed.push({
      move: moves[i],
      fen: fens[i + 1],
      evaluation: evaluationWhitePov,
      bestMove: evals[i].bestMove,
      classification,
      centipawnLoss,
    });
  }

  return {
    moves: analyzed,
    averageCentipawnLoss: {
      white: Math.round(mean(lossByColor.white)),
      black: Math.round(mean(lossByColor.black)),
    },
    accuracy: {
      white: Math.round(mean(accuracyByColor.white)),
      black: Math.round(mean(accuracyByColor.black)),
    },
    inaccuracies,
    mistakes,
    blunders,
  };
}
