import { NextResponse } from 'next/server';
import { deleteGame, getGameById } from '@/lib/games/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function resolveUserId(): Promise<string> {
  const user = await getOrCreateCurrentUser();
  return user?.id ?? (await ensureGuestUserId());
}

/** Fetch a single saved game (with PGN), scoped to the owner. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await resolveUserId();
    const game = await getGameById(userId, params.id);
    if (!game) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(game, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/games/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to load game' }, { status: 500 });
  }
}

/** Delete a saved game owned by the current user. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await resolveUserId();
    const ok = await deleteGame(userId, params.id);
    if (!ok) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/games/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
