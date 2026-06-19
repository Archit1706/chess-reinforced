import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/dashboard/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());
    const data = await getDashboardData(userId);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/dashboard failed:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
