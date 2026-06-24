'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { HeatmapDay } from '@/lib/dashboard/repository';

interface ActivityHeatmapProps {
  days: HeatmapDay[];
  className?: string;
}

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

/** Map an activity count to one of five intensity buckets. */
function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

const LEVEL_CLASS = [
  'bg-muted',
  'bg-green-500/30',
  'bg-green-500/55',
  'bg-green-500/80',
  'bg-green-600',
];

/**
 * GitHub-style contribution calendar. Columns are weeks (Sun–Sat), built from a
 * flat oldest→newest list of daily activity. Pure CSS grid, no dependencies.
 */
export function ActivityHeatmap({ days, className }: ActivityHeatmapProps) {
  if (days.length === 0) return null;

  // Pad the start so the first column begins on Sunday.
  const firstDow = new Date(days[0].date + 'T00:00:00Z').getUTCDay();
  const cells: (HeatmapDay | null)[] = [...Array(firstDow).fill(null), ...days];
  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Month labels above the columns (show when a week's first real day starts a month).
  const monthLabel = (week: (HeatmapDay | null)[]): string => {
    const firstReal = week.find((c): c is HeatmapDay => c != null);
    if (!firstReal) return '';
    const d = new Date(firstReal.date + 'T00:00:00Z');
    return d.getUTCDate() <= 7 ? d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }) : '';
  };

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className="inline-flex flex-col gap-1 min-w-max">
        {/* Month row */}
        <div className="flex gap-1 pl-8">
          {weeks.map((week, i) => (
            <div key={i} className="w-3 text-[10px] text-muted-foreground leading-none">
              {monthLabel(week)}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Weekday labels */}
          <div className="flex flex-col gap-1 pr-1 w-7 shrink-0">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 text-[10px] text-muted-foreground leading-3 text-right">
                {label}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, di) => {
                const cell = week[di];
                if (!cell) return <div key={di} className="h-3 w-3" />;
                const parts = [
                  cell.puzzles && `${cell.puzzles} puzzle${cell.puzzles > 1 ? 's' : ''}`,
                  cell.games && `${cell.games} game${cell.games > 1 ? 's' : ''}`,
                  cell.lessons && `${cell.lessons} lesson${cell.lessons > 1 ? 's' : ''}`,
                ].filter(Boolean);
                const title = `${cell.date}: ${parts.length ? parts.join(', ') : 'no activity'}`;
                return (
                  <div
                    key={di}
                    title={title}
                    className={cn('h-3 w-3 rounded-sm', LEVEL_CLASS[levelFor(cell.count)])}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 pl-8 mt-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {LEVEL_CLASS.map((c, i) => (
            <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
