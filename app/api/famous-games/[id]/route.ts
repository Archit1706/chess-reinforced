import { NextResponse } from 'next/server';
import { getFamousGameById } from '@/lib/famous-games/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const game = await getFamousGameById(params.id);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    return NextResponse.json(game, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (error) {
    console.error('GET /api/famous-games/[id] failed:', error);
    return NextResponse.json({ error: 'Failed to load game' }, { status: 500 });
  }
}
