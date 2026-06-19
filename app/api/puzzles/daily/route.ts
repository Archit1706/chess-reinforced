import { NextResponse } from 'next/server';
import { getDailyPuzzle } from '@/lib/puzzles/repository';

// Prisma needs the Node runtime; the daily puzzle is date-dependent so it must
// not be statically cached at build time.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const puzzle = await getDailyPuzzle();
    if (!puzzle) {
      return NextResponse.json(
        { error: 'No puzzles available. Run `npm run db:seed`.' },
        { status: 404 }
      );
    }
    // Cache for the rest of the UTC day; it's deterministic per date.
    return NextResponse.json(puzzle, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (error) {
    console.error('GET /api/puzzles/daily failed:', error);
    return NextResponse.json({ error: 'Failed to load daily puzzle' }, { status: 500 });
  }
}
