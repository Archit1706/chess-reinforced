import { NextRequest, NextResponse } from 'next/server';
import { getGames, saveGame } from '@/lib/games/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';
import type { SaveGameInput } from '@/lib/games/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Saved-game input bounds — guards against pathological payloads.
const MAX_PGN_BYTES = 64 * 1024; // 64 KB is plenty for any realistic chess game
const MAX_OPENING_LEN = 120;
const ALLOWED_RESULTS = new Set(['1-0', '0-1', '1/2-1/2', '*']);
const ALLOWED_COLORS = new Set(['w', 'b', 'white', 'black']);
const ALLOWED_OPPONENT_TYPES = new Set(['computer', 'puzzle', 'human']);

function clampString(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** List the current user's (or guest's) most recent games. */
export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());
    const games = await getGames(userId);
    return NextResponse.json(games, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/games failed:', error);
    return NextResponse.json({ error: 'Failed to load games' }, { status: 500 });
  }
}

/** Persist a finished game. Validated to bound payload size and whitelist enums. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Partial<SaveGameInput> | null;
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const pgn = clampString(body.pgn, MAX_PGN_BYTES);
    const result = clampString(body.result, 8);
    const playerColor = clampString(body.playerColor, 8);

    if (!pgn || !result || !playerColor) {
      return NextResponse.json({ error: 'Missing pgn/result/playerColor' }, { status: 400 });
    }
    if (!ALLOWED_RESULTS.has(result)) {
      return NextResponse.json({ error: 'Invalid result' }, { status: 400 });
    }
    if (!ALLOWED_COLORS.has(playerColor)) {
      return NextResponse.json({ error: 'Invalid playerColor' }, { status: 400 });
    }

    const opponentType = clampString(body.opponentType, 16) ?? 'computer';
    if (!ALLOWED_OPPONENT_TYPES.has(opponentType)) {
      return NextResponse.json({ error: 'Invalid opponentType' }, { status: 400 });
    }

    const rawElo = typeof body.opponentElo === 'number' ? body.opponentElo : null;
    const opponentElo =
      rawElo != null && Number.isFinite(rawElo)
        ? Math.max(100, Math.min(3500, Math.round(rawElo)))
        : null;

    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());

    const id = await saveGame(userId, {
      pgn,
      result,
      playerColor,
      opponentType,
      opponentElo,
      openingName: clampString(body.openingName, MAX_OPENING_LEN),
      openingEco: clampString(body.openingEco, 8),
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/games failed:', error);
    return NextResponse.json({ error: 'Failed to save game' }, { status: 500 });
  }
}
