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

/** One cell in the contribution-style activity calendar. */
export interface HeatmapDay {
  date: string; // ISO YYYY-MM-DD (UTC)
  count: number; // total activities that day
  puzzles: number;
  games: number;
  lessons: number;
}

export interface DashboardData {
  reviewDue: number;
  totalAttempts: number;
  activity: ActivityDay[];
  recentAttempts: RecentAttempt[];
  /** ~17 weeks of daily activity for the calendar heatmap (oldest → newest). */
  heatmap: HeatmapDay[];
  /** Days with any activity within the heatmap window. */
  activeDays: number;
  /** Consecutive active days ending today (current streak). */
  currentStreak: number;
}

/** Number of days shown in the heatmap (17 weeks). */
const HEATMAP_DAYS = 119;

function buildHeatmap(
  puzzleDates: Date[],
  gameDates: Date[],
  lessonDates: Date[]
): { heatmap: HeatmapDay[]; activeDays: number; currentStreak: number } {
  const days = new Map<string, HeatmapDay>();
  const today = new Date();
  const order: string[] = [];

  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const key = utcDayKey(d);
    days.set(key, { date: key, count: 0, puzzles: 0, games: 0, lessons: 0 });
    order.push(key);
  }

  const bump = (dates: Date[], field: 'puzzles' | 'games' | 'lessons') => {
    for (const dt of dates) {
      const cell = days.get(utcDayKey(dt));
      if (!cell) continue;
      cell[field]++;
      cell.count++;
    }
  };
  bump(puzzleDates, 'puzzles');
  bump(gameDates, 'games');
  bump(lessonDates, 'lessons');

  const heatmap = order.map((k) => days.get(k)!);
  const activeDays = heatmap.filter((d) => d.count > 0).length;

  // Current streak: walk back from today while days have activity.
  let currentStreak = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i].count > 0) currentStreak++;
    else break;
  }

  return { heatmap, activeDays, currentStreak };
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
  const heatmapSince = new Date(Date.now() - HEATMAP_DAYS * DAY_MS);

  const [weekAttempts, recent, totalAttempts, reviewDue, heatPuzzles, heatGames, heatLessons] =
    await Promise.all([
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
      prisma.puzzleAttempt.findMany({
        where: { userId, createdAt: { gte: heatmapSince } },
        select: { createdAt: true },
      }),
      prisma.gameHistory.findMany({
        where: { userId, createdAt: { gte: heatmapSince } },
        select: { createdAt: true },
      }),
      prisma.lessonProgress.findMany({
        where: { userId, completed: true, completedAt: { gte: heatmapSince } },
        select: { completedAt: true },
      }),
    ]);

  const { heatmap, activeDays, currentStreak } = buildHeatmap(
    heatPuzzles.map((p) => p.createdAt),
    heatGames.map((g) => g.createdAt),
    heatLessons.map((l) => l.completedAt).filter((d): d is Date => d != null)
  );

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
    heatmap,
    activeDays,
    currentStreak,
  };
}
