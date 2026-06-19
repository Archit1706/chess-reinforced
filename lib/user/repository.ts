/**
 * Server-side user/progress persistence (Prisma).
 *
 * The DB stores stats as flat columns; `winRate` and `puzzleSuccessRate` are
 * derived on read so they can never drift out of sync.
 */

import type { User as DbUser } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getOrCreateCurrentUser } from '@/lib/auth';
import type { User, UserStats } from '@/types/user';

function computeWinRate(won: number, played: number): number {
  return played > 0 ? Math.round((won / played) * 100) : 0;
}

function computePuzzleSuccessRate(solved: number, failed: number): number {
  const total = solved + failed;
  return total > 0 ? Math.round((solved / total) * 100) : 0;
}

/** Map a DB row to the client `User` DTO, computing derived stats. */
export function mapUserToDTO(row: DbUser): User {
  const stats: UserStats = {
    estimatedElo: row.estimatedElo,
    gamesPlayed: row.gamesPlayed,
    gamesWon: row.gamesWon,
    gamesLost: row.gamesLost,
    gamesDraw: row.gamesDraw,
    winRate: computeWinRate(row.gamesWon, row.gamesPlayed),
    puzzlesSolved: row.puzzlesSolved,
    puzzlesFailed: row.puzzlesFailed,
    puzzleSuccessRate: computePuzzleSuccessRate(row.puzzlesSolved, row.puzzlesFailed),
    puzzleStreak: row.puzzleStreak,
    bestPuzzleStreak: row.bestPuzzleStreak,
    currentStreak: row.currentStreak,
    longestStreak: row.longestStreak,
    lastActiveAt: row.lastActiveAt,
  };
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName ?? undefined,
    createdAt: row.createdAt,
    stats,
  };
}

/** The signed-in user's profile + stats, provisioning on first access. */
export async function getCurrentUserDTO(): Promise<User | null> {
  const row = await getOrCreateCurrentUser();
  return row ? mapUserToDTO(row) : null;
}

/** Columns a client is allowed to write via the progress endpoint. */
const WRITABLE_STAT_FIELDS = [
  'estimatedElo',
  'gamesPlayed',
  'gamesWon',
  'gamesLost',
  'gamesDraw',
  'puzzlesSolved',
  'puzzlesFailed',
  'puzzleStreak',
  'bestPuzzleStreak',
  'currentStreak',
  'longestStreak',
] as const;

/**
 * Persist the signed-in user's stats. Accepts a partial stats object; only the
 * whitelisted, integer-valued fields are written. Returns the updated DTO, or
 * null when there is no authenticated user.
 */
export async function saveCurrentUserStats(
  partial: Partial<UserStats>
): Promise<User | null> {
  const current = await getOrCreateCurrentUser();
  if (!current) return null;

  const data: Record<string, number | Date> = {};
  for (const field of WRITABLE_STAT_FIELDS) {
    const value = partial[field];
    if (typeof value === 'number' && Number.isFinite(value)) {
      data[field] = Math.round(value);
    }
  }
  // Always advance activity time on a save.
  data.lastActiveAt = partial.lastActiveAt ? new Date(partial.lastActiveAt) : new Date();

  const updated = await prisma.user.update({ where: { id: current.id }, data });
  return mapUserToDTO(updated);
}
