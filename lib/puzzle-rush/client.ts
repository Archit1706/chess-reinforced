/**
 * Client-side access to Puzzle Rush best scores. Graceful: any failure
 * (signed out, DB down, table not yet pushed) resolves to safe defaults so the
 * UI falls back to its localStorage best.
 */

import type { RushMode } from './repository';

export type { RushMode };

const EMPTY: Record<RushMode, number> = { '3min': 0, '5min': 0, survival: 0 };

export async function fetchRushBest(): Promise<Record<RushMode, number>> {
  try {
    const res = await fetch('/api/puzzle-rush');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as Record<RushMode, number>;
  } catch (error) {
    console.warn('Failed to load Puzzle Rush best scores:', error);
    return { ...EMPTY };
  }
}

/** Submit a finished run; returns the server-side best for that mode (or null). */
export async function submitRushScore(mode: RushMode, score: number): Promise<number | null> {
  try {
    const res = await fetch('/api/puzzle-rush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, score }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { best: number };
    return data.best;
  } catch (error) {
    console.warn('Failed to submit Puzzle Rush score:', error);
    return null;
  }
}
