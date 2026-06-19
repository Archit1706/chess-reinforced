/**
 * Client-side puzzle access.
 *
 * Thin fetch wrappers over the puzzle API, each with a built-in fallback so the
 * Puzzles page keeps working even if the API/DB is unavailable (e.g. the DB was
 * never seeded, or a transient server error). The fallback is a small set of
 * real, pre-normalized Lichess puzzles spanning a range of ratings.
 */

import type { NormalizedPuzzle, PuzzleQuery } from './types';

/** Real Lichess puzzles (CC0), already normalized to solver-first form. */
export const FALLBACK_PUZZLES: NormalizedPuzzle[] = [
  {"id":"00GRa","fen":"1r3rk1/2p1qppb/p2n4/1p2p1Pp/4Qn1P/2P1N3/PPB2P1K/3R2R1 w - - 0 29","moves":["e4h7"],"rating":438,"themes":["kingsideAttack","mate","mateIn1"]},
  {"id":"00ERL","fen":"4r1k1/2Q4p/pp6/2p2n2/P2P1P1q/2P4P/2PB2b1/4R1K1 w - - 0 30","moves":["e1e8"],"rating":871,"themes":["mate","mateIn1","middlegame"]},
  {"id":"00GY4","fen":"3k2r1/pR5R/3r4/4p3/7q/3Pn1PP/PP5K/8 w - - 0 28","moves":["b7b8"],"rating":1167,"themes":["endgame","mate","mateIn1"]},
  {"id":"007AS","fen":"1r2kb1r/3nnpp1/4p1bp/1NppP3/3P4/6N1/P2BBPPP/R3K2R w KQk - 1 18","moves":["b5d6","e8d8","d2a5"],"rating":1601,"themes":["crushing","master","middlegame"]},
  {"id":"003md","fen":"r1b1k2N/ppp3pp/2n5/2bp4/7q/1B4n1/PPPP1P1P/RNBQR1K1 b q - 1 10","moves":["g3e4","e1e4","d5e4","d1h5","h4h5","b3f7","h5f7"],"rating":2171,"themes":["crushing","defensiveMove","middlegame"]},
  {"id":"006of","fen":"r2qr2k/1pp2Qp1/1b4np/pP2P3/P4n2/B1N2N1P/5PP1/R3R1K1 b - - 0 20","moves":["d8d3","c3e2","f4e2","e1e2","d3e2"],"rating":2651,"themes":["advantage","kingsideAttack","long"]},
];

function fallbackByRating(query: PuzzleQuery = {}): NormalizedPuzzle {
  const { minRating, maxRating, exclude = [] } = query;
  const pool = FALLBACK_PUZZLES.filter(
    (p) =>
      !exclude.includes(p.id) &&
      (minRating == null || p.rating >= minRating) &&
      (maxRating == null || p.rating <= maxRating)
  );
  const list = pool.length ? pool : FALLBACK_PUZZLES;
  return list[Math.floor(Math.random() * list.length)];
}

export async function fetchDailyPuzzle(): Promise<NormalizedPuzzle> {
  try {
    const res = await fetch('/api/puzzles/daily');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as NormalizedPuzzle;
  } catch (error) {
    console.warn('Falling back to bundled daily puzzle:', error);
    // Deterministic per UTC day, mirroring the server behaviour.
    const dayIndex = Math.floor(Date.now() / 86_400_000) % FALLBACK_PUZZLES.length;
    return FALLBACK_PUZZLES[dayIndex];
  }
}

export async function fetchRandomPuzzle(query: PuzzleQuery = {}): Promise<NormalizedPuzzle> {
  try {
    const params = new URLSearchParams();
    if (query.minRating != null) params.set('minRating', String(query.minRating));
    if (query.maxRating != null) params.set('maxRating', String(query.maxRating));
    if (query.theme) params.set('theme', query.theme);
    if (query.exclude?.length) params.set('exclude', query.exclude.join(','));

    const res = await fetch(`/api/puzzles/random?${params.toString()}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as NormalizedPuzzle;
  } catch (error) {
    console.warn('Falling back to bundled random puzzle:', error);
    return fallbackByRating(query);
  }
}

/** Fire-and-forget attempt logging; never throws. */
export async function recordPuzzleAttempt(input: {
  puzzleId: string;
  solved: boolean;
  timeSpent?: number;
  hintsUsed?: number;
}): Promise<void> {
  try {
    await fetch('/api/puzzles/attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch (error) {
    console.warn('Failed to record puzzle attempt:', error);
  }
}

export interface ReviewQueue {
  /** Total puzzles currently due for review. */
  due: number;
  /** A batch of due puzzles, soonest first. */
  puzzles: NormalizedPuzzle[];
}

/** Due spaced-repetition puzzles for the current user. Empty on error. */
export async function fetchReviewPuzzles(count = 20): Promise<ReviewQueue> {
  try {
    const res = await fetch(`/api/puzzles/review?count=${count}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as ReviewQueue;
  } catch (error) {
    console.warn('Failed to load review puzzles:', error);
    return { due: 0, puzzles: [] };
  }
}

export async function fetchThemes(): Promise<{ theme: string; count: number }[]> {
  try {
    const res = await fetch('/api/puzzles/themes');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as { theme: string; count: number }[];
  } catch (error) {
    console.warn('Failed to load themes:', error);
    return [];
  }
}
