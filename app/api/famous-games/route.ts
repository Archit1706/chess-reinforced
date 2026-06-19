import { NextResponse } from 'next/server';
import { getFamousGames } from '@/lib/famous-games/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const games = await getFamousGames();
    return NextResponse.json(games, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (error) {
    console.error('GET /api/famous-games failed:', error);
    return NextResponse.json({ error: 'Failed to load games' }, { status: 500 });
  }
}
