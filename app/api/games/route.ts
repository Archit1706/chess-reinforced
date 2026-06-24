import { NextRequest, NextResponse } from 'next/server';
import { getGames, saveGame } from '@/lib/games/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';
import type { SaveGameInput } from '@/lib/games/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

/** Persist a finished game. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<SaveGameInput>;
    if (!body?.pgn || !body?.result || !body?.playerColor) {
      return NextResponse.json({ error: 'Missing pgn/result/playerColor' }, { status: 400 });
    }

    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());

    const id = await saveGame(userId, {
      pgn: body.pgn,
      result: body.result,
      playerColor: body.playerColor,
      opponentType: body.opponentType,
      opponentElo: body.opponentElo ?? null,
      openingName: body.openingName ?? null,
      openingEco: body.openingEco ?? null,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/games failed:', error);
    return NextResponse.json({ error: 'Failed to save game' }, { status: 500 });
  }
}
