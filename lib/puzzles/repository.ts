/**
 * Server-side puzzle queries (Prisma / SQLite).
 *
 * Kept separate from the API route handlers so the data access can be reused
 * and unit-tested without a request context. All reads use count + offset
 * rather than `ORDER BY RANDOM()` so they stay index-friendly as the table
 * grows toward the full multi-million-row Lichess set.
 */

import type { Puzzle } from '@prisma/client';
import { prisma } from '@/lib/db';
import { deserializeThemes } from './lichess';
import type { NormalizedPuzzle, PuzzleQuery } from './types';

const GUEST_USERNAME = 'guest';

function toDTO(row: Puzzle): NormalizedPuzzle {
  return {
    id: row.id,
    fen: row.fen,
    moves: row.moves.trim().split(/\s+/).filter(Boolean),
    rating: row.rating,
    themes: deserializeThemes(row.themes),
  };
}

/** FNV-1a 32-bit hash — small, stable, dependency-free. */
function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Total number of imported puzzles. */
export function countPuzzles(): Promise<number> {
  return prisma.puzzle.count();
}

/**
 * Deterministic "puzzle of the day": the same date always maps to the same
 * puzzle, with no write required. Ordered by id for a stable offset.
 */
export async function getDailyPuzzle(date = new Date()): Promise<NormalizedPuzzle | null> {
  const total = await countPuzzles();
  if (total === 0) return null;

  const key = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const offset = hashString(key) % total;

  const [row] = await prisma.puzzle.findMany({
    orderBy: { id: 'asc' },
    skip: offset,
    take: 1,
  });
  return row ? toDTO(row) : null;
}

/**
 * A random puzzle matching optional rating/theme filters, avoiding `exclude`d
 * ids. Falls back gracefully (drops filters) rather than returning nothing.
 */
export async function getRandomPuzzle(query: PuzzleQuery = {}): Promise<NormalizedPuzzle | null> {
  const { minRating, maxRating, theme, exclude = [] } = query;

  const where: NonNullable<Parameters<typeof prisma.puzzle.findMany>[0]>['where'] = {};
  if (minRating != null || maxRating != null) {
    where.rating = {};
    if (minRating != null) where.rating.gte = minRating;
    if (maxRating != null) where.rating.lte = maxRating;
  }
  // Substring match narrows candidates; exact token is verified below.
  if (theme) where.themes = { contains: theme };
  if (exclude.length) where.id = { notIn: exclude };

  const matching = await prisma.puzzle.count({ where });
  if (matching === 0) {
    // Relax to any puzzle so the UI never dead-ends.
    return exclude.length ? getRandomPuzzle({ ...query, exclude: [] }) : getDailyPuzzle();
  }

  // Sample a small window at a random offset, then pick one that truly carries
  // the requested theme (guards against substring false positives).
  const windowSize = Math.min(matching, 32);
  const offset = Math.floor(Math.random() * (matching - windowSize + 1));
  const rows = await prisma.puzzle.findMany({ where, skip: offset, take: windowSize });

  const exact = theme
    ? rows.filter((r) => deserializeThemes(r.themes).includes(theme))
    : rows;
  const pool = exact.length ? exact : rows;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen ? toDTO(chosen) : null;
}

export async function getPuzzleById(id: string): Promise<NormalizedPuzzle | null> {
  const row = await prisma.puzzle.findUnique({ where: { id } });
  return row ? toDTO(row) : null;
}

/** Distinct themes with puzzle counts, most common first. */
export async function getThemeCounts(limit = 40): Promise<{ theme: string; count: number }[]> {
  const rows = await prisma.puzzle.findMany({ select: { themes: true } });
  const counts = new Map<string, number>();
  for (const { themes } of rows) {
    for (const t of deserializeThemes(themes)) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([theme, count]) => ({ theme, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Record a puzzle attempt. Tolerant by design: auto-provisions the guest user,
 * and silently no-ops if the puzzle isn't in the DB (e.g. a client fallback
 * puzzle) so attempt logging can never break the solving flow.
 */
export async function recordAttempt(params: {
  puzzleId: string;
  solved: boolean;
  timeSpent?: number;
  hintsUsed?: number;
  userId?: string;
}): Promise<{ recorded: boolean }> {
  const { puzzleId, solved, timeSpent = 0, hintsUsed = 0 } = params;

  const puzzle = await prisma.puzzle.findUnique({ where: { id: puzzleId }, select: { id: true } });
  if (!puzzle) return { recorded: false };

  const user = await prisma.user.upsert({
    where: { username: GUEST_USERNAME },
    update: {},
    create: { username: GUEST_USERNAME, displayName: 'Guest' },
    select: { id: true },
  });

  await prisma.puzzleAttempt.create({
    data: { userId: user.id, puzzleId, solved, timeSpent, hintsUsed },
  });
  return { recorded: true };
}
