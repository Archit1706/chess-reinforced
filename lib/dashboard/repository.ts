/**
 * Dashboard aggregations (Prisma).
 *
 * Derives real activity/accuracy from the PuzzleAttempt log and the review
 * schedule, scoped to a single user. Game history isn't persisted yet, so the
 * dashboard's game stats come from the user's stored counters (client store),
 * not from here.
 */

import { prisma } from '@/lib/db';
import { deserializeThemes } from '@/lib/puzzles/lichess';
import { countDueReviews } from '@/lib/puzzles/repository';

export interface ActivityDay {
  /** Short weekday label, e.g. "Mon". */
  label: string;
  /** ISO date (YYYY-MM-DD, UTC). */
  date: string;
  solved: number;
  failed: number;
  /** Solve rate 0–100, or null if no attempts that day. */
  accuracy: number | null;
}

export interface RecentAttempt {
  id: string;
  puzzleId: string;
  rating: number;
  themes: string[];
  solved: boolean;
  createdAt: string;
}

export interface DashboardData {
  reviewDue: number;
  totalAttempts: number;
  activity: ActivityDay[];
  recentAttempts: RecentAttempt[];
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_MS = 86_400_000;

function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Build the last `days` daily activity buckets (oldest → newest). */
function buildActivity(
  attempts: { createdAt: Date; solved: boolean }[],
  days = 7
): ActivityDay[] {
  const buckets = new Map<string, { solved: number; failed: number }>();
  const today = new Date();
  const result: ActivityDay[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = utcDayKey(d);
    buckets.set(key, { solved: 0, failed: 0 });
    result.push({ label: WEEKDAY[d.getUTCDay()], date: key, solved: 0, failed: 0, accuracy: null });
  }

  for (const a of attempts) {
    const bucket = buckets.get(utcDayKey(a.createdAt));
    if (!bucket) continue;
    if (a.solved) bucket.solved++;
    else bucket.failed++;
  }

  for (const day of result) {
    const b = buckets.get(day.date)!;
    day.solved = b.solved;
    day.failed = b.failed;
    const total = b.solved + b.failed;
    day.accuracy = total > 0 ? Math.round((b.solved / total) * 100) : null;
  }
  return result;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const since = new Date(Date.now() - 7 * DAY_MS);

  const [weekAttempts, recent, totalAttempts, reviewDue] = await Promise.all([
    prisma.puzzleAttempt.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true, solved: true },
    }),
    prisma.puzzleAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { puzzle: { select: { rating: true, themes: true } } },
    }),
    prisma.puzzleAttempt.count({ where: { userId } }),
    countDueReviews(userId),
  ]);

  return {
    reviewDue,
    totalAttempts,
    activity: buildActivity(weekAttempts),
    recentAttempts: recent.map((a) => ({
      id: a.id,
      puzzleId: a.puzzleId,
      rating: a.puzzle.rating,
      themes: deserializeThemes(a.puzzle.themes).slice(0, 2),
      solved: a.solved,
      createdAt: a.createdAt.toISOString(),
    })),
  };
}
