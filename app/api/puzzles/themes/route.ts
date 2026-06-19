import { NextResponse } from 'next/server';
import { getThemeCounts } from '@/lib/puzzles/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const themes = await getThemeCounts();
    return NextResponse.json(themes, {
      headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
    });
  } catch (error) {
    console.error('GET /api/puzzles/themes failed:', error);
    return NextResponse.json({ error: 'Failed to load themes' }, { status: 500 });
  }
}
