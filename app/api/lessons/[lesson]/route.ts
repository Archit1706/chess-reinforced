import { NextResponse } from 'next/server';
import { getLessonBySlug } from '@/lib/lessons/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { lesson: string } }
) {
  try {
    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());
    const lesson = await getLessonBySlug(params.lesson, userId);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json(lesson, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('GET /api/lessons/[lesson] failed:', error);
    return NextResponse.json({ error: 'Failed to load lesson' }, { status: 500 });
  }
}
