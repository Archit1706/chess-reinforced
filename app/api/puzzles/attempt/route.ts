import { NextResponse } from 'next/server';
import { recordAttempt } from '@/lib/puzzles/repository';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AttemptBody {
  puzzleId?: unknown;
  solved?: unknown;
  timeSpent?: unknown;
  hintsUsed?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AttemptBody;

    if (typeof body.puzzleId !== 'string' || typeof body.solved !== 'boolean') {
      return NextResponse.json(
        { error: 'puzzleId (string) and solved (boolean) are required' },
        { status: 400 }
      );
    }

    const result = await recordAttempt({
      puzzleId: body.puzzleId,
      solved: body.solved,
      timeSpent: typeof body.timeSpent === 'number' ? body.timeSpent : undefined,
      hintsUsed: typeof body.hintsUsed === 'number' ? body.hintsUsed : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('POST /api/puzzles/attempt failed:', error);
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 });
  }
}
