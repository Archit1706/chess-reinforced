import { NextResponse } from 'next/server';
import { getModulesWithProgress } from '@/lib/lessons/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());
    const modules = await getModulesWithProgress(userId);
    return NextResponse.json(modules, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/lessons failed:', error);
    return NextResponse.json({ error: 'Failed to load lessons' }, { status: 500 });
  }
}
