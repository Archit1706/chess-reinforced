/**
 * Server-side queries for saved games (GameHistory).
 *
 * Finishes wiring the GameHistory model that was defined in the schema but not
 * yet surfaced anywhere. Games are attributed to the signed-in user, else the
 * shared guest user. A per-user cap keeps storage bounded on the free tier.
 */

import { prisma } from '@/lib/db';
import {
  deriveOutcome,
  normalizeColor,
  type GameDetailDTO,
  type GameSummaryDTO,
  type SaveGameInput,
} from './types';

/** Keep at most this many games per user; older rows are trimmed on insert. */
const MAX_GAMES_PER_USER = 200;

function toSummary(row: {
  id: string;
  createdAt: Date;
  result: string;
  playerColor: string;
  opponentType: string;
  opponentElo: number | null;
  openingName: string | null;
  openingEco: string | null;
  analyzed: boolean;
}): GameSummaryDTO {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    result: row.result,
    playerColor: row.playerColor,
    outcome: deriveOutcome(row.result, row.playerColor),
    opponentType: row.opponentType,
    opponentElo: row.opponentElo,
    openingName: row.openingName,
    openingEco: row.openingEco,
    analyzed: row.analyzed,
  };
}

/** Persist a finished game. Returns the new row's id. */
export async function saveGame(userId: string, input: SaveGameInput): Promise<string> {
  const created = await prisma.gameHistory.create({
    data: {
      userId,
      pgn: input.pgn,
      result: input.result,
      playerColor: normalizeColor(input.playerColor),
      opponentType: input.opponentType ?? 'computer',
      opponentElo: input.opponentElo ?? null,
      openingName: input.openingName ?? null,
      openingEco: input.openingEco ?? null,
    },
    select: { id: true },
  });

  // Trim history beyond the cap (oldest first) so storage stays bounded.
  const count = await prisma.gameHistory.count({ where: { userId } });
  if (count > MAX_GAMES_PER_USER) {
    const stale = await prisma.gameHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: MAX_GAMES_PER_USER,
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.gameHistory.deleteMany({
        where: { id: { in: stale.map((g) => g.id) } },
      });
    }
  }

  return created.id;
}

/** Most recent games for a user (no PGN payload). */
export async function getGames(userId: string, limit = 100): Promise<GameSummaryDTO[]> {
  const rows = await prisma.gameHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      result: true,
      playerColor: true,
      opponentType: true,
      opponentElo: true,
      openingName: true,
      openingEco: true,
      analyzed: true,
    },
  });
  return rows.map(toSummary);
}

/** A single game (with PGN) scoped to the owning user, or null. */
export async function getGameById(userId: string, id: string): Promise<GameDetailDTO | null> {
  const row = await prisma.gameHistory.findFirst({
    where: { id, userId },
  });
  if (!row) return null;
  return { ...toSummary(row), pgn: row.pgn };
}

/** Delete a game owned by the user. Returns true if a row was removed. */
export async function deleteGame(userId: string, id: string): Promise<boolean> {
  const res = await prisma.gameHistory.deleteMany({ where: { id, userId } });
  return res.count > 0;
}
