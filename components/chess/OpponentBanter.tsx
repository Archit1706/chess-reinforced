'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, X } from 'lucide-react';
import { useGameStore } from '@/store/game-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';
import {
  banterLine,
  materialBalance,
  deriveBanterEvent,
  initialBanterMemory,
  type BanterLine,
} from '@/lib/banter';

const TONE_STYLES: Record<string, string> = {
  taunt: 'text-amber-600 dark:text-amber-400',
  praise: 'text-green-600 dark:text-green-400',
  coach: 'text-primary-600 dark:text-primary-400',
  neutral: 'text-foreground',
};

function opponentName(elo: number): string {
  if (elo < 1000) return 'Rookie Bot';
  if (elo < 1400) return 'Casual Bot';
  if (elo < 1800) return 'Club Bot';
  if (elo < 2200) return 'Expert Bot';
  return 'Master Bot';
}

/**
 * The computer's in-game personality: a compact, dismissible speech bubble that
 * reacts to notable moments (blunders, captures, checks, castling, take-backs,
 * material swings, game start/end) with a taunt, praise or a coaching nudge.
 *
 * Reads game/UI state directly so the play page only has to drop it in. Renders
 * nothing unless it's a vs-computer game, banter is enabled, and there's a line
 * to show. All detection is material/event based — no engine calls — so it's
 * fast, reliable and never blocks play.
 */
export function OpponentBanter() {
  const { history, fen, isGameOver, isCheckmate, turn, playerColor, computerElo, mode } =
    useGameStore();
  const opponentBanter = useUIStore((s) => s.opponentBanter);

  const [line, setLine] = useState<BanterLine | null>(null);

  const memory = useRef(initialBanterMemory());
  const lastText = useRef('');

  useEffect(() => {
    if (!opponentBanter || mode !== 'vsComputer') return;

    const len = history.length;
    const balance = materialBalance(fen);
    const playerBal = playerColor === 'w' ? balance : -balance;
    const last = len > 0 ? history[len - 1] : null;

    const { event, memory: nextMemory } = deriveBanterEvent(
      {
        len,
        playerBal,
        isGameOver,
        isCheckmate,
        turnIsPlayer: turn === playerColor,
        playerColor,
        last: last ? { color: last.color, san: last.san, captured: last.captured ?? null } : null,
      },
      memory.current
    );
    memory.current = nextMemory;

    if (event) {
      let l = banterLine(event, Math.random());
      if (l.text && l.text === lastText.current) l = banterLine(event, Math.random());
      if (l.text) {
        lastText.current = l.text;
        setLine(l);
      }
    }
  }, [history, fen, isGameOver, isCheckmate, turn, playerColor, mode, opponentBanter]);

  if (!opponentBanter || mode !== 'vsComputer' || !line) return null;

  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border bg-card p-2.5 shadow-sm"
      aria-live="polite"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
        <Bot className="h-4 w-4 text-primary-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          {opponentName(computerElo)}
          <span className="font-normal tabular-nums">· {computerElo}</span>
        </div>
        <p className={cn('text-sm leading-snug', TONE_STYLES[line.tone] ?? 'text-foreground')}>
          {line.text}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setLine(null)}
        aria-label="Dismiss opponent message"
        className="shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
