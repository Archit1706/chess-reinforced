import { NextRequest, NextResponse } from 'next/server';
import { getBestScores, saveRushScore, type RushMode } from '@/lib/puzzle-rush/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODES: RushMode[] = ['3min', '5min', 'survival'];

async function resolveUserId(): Promise<string> {
  const user = await getOrCreateCurrentUser();
  return user?.id ?? (await ensureGuestUserId());
}

/** Best Puzzle Rush score per mode for the current user/guest. */
export async function GET() {
  try {
    const userId = await resolveUserId();
    const best = await getBestScores(userId);
    return NextResponse.json(best, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/puzzle-rush failed:', error);
    // Degrade gracefully (e.g. table not pushed yet) so the client uses its local best.
    return NextResponse.json({ '3min': 0, '5min': 0, survival: 0 });
  }
}

/** Maximum plausible Puzzle Rush score — bounds runaway client values. */
const MAX_RUSH_SCORE = 1000;

/** Persist a finished run; returns the new best for that mode. */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as { mode?: unknown; score?: unknown } | null;
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (typeof body.mode !== 'string' || !MODES.includes(body.mode as RushMode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }
    const mode = body.mode as RushMode;

    const rawScore = typeof body.score === 'number' ? body.score : Number(body.score);
    if (!Number.isFinite(rawScore) || rawScore < 0) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }
    const score = Math.min(MAX_RUSH_SCORE, Math.max(0, Math.floor(rawScore)));

    const userId = await resolveUserId();
    const best = await saveRushScore(userId, mode, score);
    return NextResponse.json({ best }, { status: 201 });
  } catch (error) {
    console.error('POST /api/puzzle-rush failed:', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
