import { NextResponse } from 'next/server';
import { getCurrentUserDTO } from '@/lib/user/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUserDTO();
    if (!user) {
      // Signed out (or Clerk not configured) — client falls back to guest.
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json(user, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/user failed:', error);
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
  }
}
