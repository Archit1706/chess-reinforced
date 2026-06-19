import { NextResponse } from 'next/server';
import { getRandomPuzzle } from '@/lib/puzzles/repository';
import type { PuzzleQuery } from '@/lib/puzzles/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseIntParam(value: string | null): number | undefined {
  if (value == null) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const query: PuzzleQuery = {
      minRating: parseIntParam(params.get('minRating')),
      maxRating: parseIntParam(params.get('maxRating')),
      theme: params.get('theme') ?? undefined,
      exclude: params.get('exclude')?.split(',').filter(Boolean) ?? [],
    };

    const puzzle = await getRandomPuzzle(query);
    if (!puzzle) {
      return NextResponse.json(
        { error: 'No puzzles available. Run `npm run db:seed`.' },
        { status: 404 }
      );
    }
    // Always fresh — each request should yield a new random puzzle.
    return NextResponse.json(puzzle, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('GET /api/puzzles/random failed:', error);
    return NextResponse.json({ error: 'Failed to load puzzle' }, { status: 500 });
  }
}
