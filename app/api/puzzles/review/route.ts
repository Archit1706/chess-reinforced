import { NextResponse } from 'next/server';
import { getDueReviews, countDueReviews, ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const countParam = Number.parseInt(params.get('count') ?? '', 10);
    const count = Number.isFinite(countParam) ? countParam : 20;

    // Scope reviews to the signed-in user, or the shared guest when signed out.
    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());

    const [due, puzzles] = await Promise.all([
      countDueReviews(userId),
      getDueReviews(userId, count),
    ]);

    return NextResponse.json(
      { due, puzzles },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('GET /api/puzzles/review failed:', error);
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 });
  }
}
