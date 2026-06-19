import { NextResponse } from 'next/server';
import { saveCurrentUserStats } from '@/lib/user/repository';
import type { UserStats } from '@/types/user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<UserStats>;
    const user = await saveCurrentUserStats(body);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error('POST /api/user/progress failed:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
