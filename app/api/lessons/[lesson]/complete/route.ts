import { NextResponse } from 'next/server';
import { setLessonCompleted } from '@/lib/lessons/repository';
import { ensureGuestUserId } from '@/lib/puzzles/repository';
import { getOrCreateCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { lesson: string } }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as { completed?: unknown };
    // Default to marking complete; pass { completed: false } to undo.
    const completed = body.completed !== false;

    const user = await getOrCreateCurrentUser();
    const userId = user?.id ?? (await ensureGuestUserId());

    const ok = await setLessonCompleted(userId, params.lesson, completed);
    if (!ok) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }
    return NextResponse.json({ completed });
  } catch (error) {
    console.error('POST /api/lessons/[lesson]/complete failed:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
