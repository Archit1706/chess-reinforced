/**
 * Server-side queries for the seeded FamousGame collection (study mode).
 */

import type { FamousGame } from '@prisma/client';
import { prisma } from '@/lib/db';
import { deserializeThemes } from '@/lib/puzzles/lichess';
import type { FamousGameDetail, FamousGameSummary } from './types';

function toSummary(row: FamousGame): FamousGameSummary {
  return {
    id: row.id,
    white: row.white,
    black: row.black,
    year: row.year,
    event: row.event,
    result: row.result,
    eco: row.eco,
    themes: deserializeThemes(row.themes),
    difficulty: row.difficulty,
  };
}

export async function getFamousGames(): Promise<FamousGameSummary[]> {
  const rows = await prisma.famousGame.findMany({
    orderBy: [{ difficulty: 'asc' }, { year: 'asc' }],
  });
  return rows.map(toSummary);
}

export async function getFamousGameById(id: string): Promise<FamousGameDetail | null> {
  const row = await prisma.famousGame.findUnique({ where: { id } });
  if (!row) return null;
  return { ...toSummary(row), pgn: row.pgn };
}
