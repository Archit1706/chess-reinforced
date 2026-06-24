/**
 * Server-side persistence for Puzzle Rush results.
 *
 * Each completed run is stored as a row; best scores are derived per mode.
 * Tolerant by design: if the table hasn't been pushed yet (db:push), the API
 * layer catches and the client falls back to its localStorage best.
 */

import { prisma } from '@/lib/db';

export type RushMode = '3min' | '5min' | 'survival';

/** Record a completed run; returns the user's best score for that mode. */
export async function saveRushScore(
  userId: string,
  mode: RushMode,
  score: number
): Promise<number> {
  await prisma.puzzleRushScore.create({ data: { userId, mode, score } });
  return getBestScore(userId, mode);
}

/** Best score for one mode (0 if none). */
export async function getBestScore(userId: string, mode: RushMode): Promise<number> {
  const top = await prisma.puzzleRushScore.findFirst({
    where: { userId, mode },
    orderBy: { score: 'desc' },
    select: { score: true },
  });
  return top?.score ?? 0;
}

/** Best score per mode for a user. */
export async function getBestScores(userId: string): Promise<Record<RushMode, number>> {
  const rows = await prisma.puzzleRushScore.groupBy({
    by: ['mode'],
    where: { userId },
    _max: { score: true },
  });
  const best: Record<RushMode, number> = { '3min': 0, '5min': 0, survival: 0 };
  for (const r of rows) {
    if (r.mode in best) best[r.mode as RushMode] = r._max.score ?? 0;
  }
  return best;
}
