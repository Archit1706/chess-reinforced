'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Chessboard } from 'react-chessboard';
import { Compass, Timer, Trophy, ArrowLeft, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useContainerWidth } from '@/hooks/useContainerWidth';

const BOARD_STYLE = {
  customDarkSquareStyle: { backgroundColor: '#b58863' },
  customLightSquareStyle: { backgroundColor: '#f0d9b5' },
} as const;

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;
const ROUND_SECONDS = 30;
const BEST_KEY = 'chess-coordinates-best';

type Phase = 'idle' | 'playing' | 'done';
type Orientation = 'white' | 'black';

function randomSquare(exclude?: string): string {
  let sq = exclude;
  while (!sq || sq === exclude) {
    sq = FILES[Math.floor(Math.random() * 8)] + RANKS[Math.floor(Math.random() * 8)];
  }
  return sq;
}

export default function CoordinatesTrainerPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [target, setTarget] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [orientation, setOrientation] = useState<Orientation>('white');
  const [best, setBest] = useState(0);
  const [feedback, setFeedback] = useState<{ square: string; correct: boolean } | null>(null);

  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [boardRef, containerWidth] = useContainerWidth<HTMLDivElement>();
  const boardWidth = Math.min(480, containerWidth > 0 ? containerWidth : 480);

  // Load the saved best once on mount (guest-safe; tolerate private-mode throws).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw) setBest(Math.max(0, parseInt(raw, 10) || 0));
    } catch {
      /* ignore */
    }
  }, []);

  // Countdown while playing.
  useEffect(() => {
    if (phase !== 'playing') return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // End the round exactly once when the clock runs out.
  useEffect(() => {
    if (phase !== 'playing' || timeLeft > 0) return;
    setPhase('done');
    setFeedback(null);
    setBest((prevBest) => {
      const next = Math.max(prevBest, score);
      try {
        localStorage.setItem(BEST_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [phase, timeLeft, score]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  const flash = useCallback((square: string, correct: boolean) => {
    setFeedback({ square, correct });
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 260);
  }, []);

  const start = useCallback(() => {
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setFeedback(null);
    setTarget(randomSquare());
    setPhase('playing');
  }, []);

  const onSquareClick = useCallback(
    (square: string) => {
      if (phase !== 'playing' || !target) return;
      if (square === target) {
        setScore((s) => s + 1);
        flash(square, true);
        setTarget((prev) => randomSquare(prev ?? undefined));
      } else {
        // Wrong guess: flash the mistaken square red; keep the same target so the
        // reader can find it (forgiving for a total beginner).
        flash(square, false);
      }
    },
    [phase, target, flash]
  );

  const squareStyles = feedback
    ? {
        [feedback.square]: {
          background: feedback.correct ? 'rgba(34,197,94,0.65)' : 'rgba(220,38,38,0.6)',
        },
      }
    : {};

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/lessons"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learn
        </Link>
        <h1 className="mt-3 flex items-center gap-2 text-3xl font-bold">
          <Compass className="h-7 w-7 text-primary-600" />
          Coordinates Trainer
        </h1>
        <p className="mt-1 text-muted-foreground">
          Every square has a name. Find as many as you can in {ROUND_SECONDS} seconds — the fastest
          way to learn to read the board and chess notation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Board — min-w-0 lets this grid item shrink below the board's
            intrinsic width so it stays responsive on narrow screens. */}
        <div ref={boardRef} className="mx-auto w-full min-w-0 max-w-[480px]">
          <Chessboard
            position="8/8/8/8/8/8/8/8"
            boardWidth={boardWidth}
            boardOrientation={orientation}
            onSquareClick={onSquareClick}
            arePiecesDraggable={false}
            showBoardNotation={phase !== 'playing'}
            customSquareStyles={squareStyles}
            {...BOARD_STYLE}
          />
          {phase === 'playing' && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Coordinates are hidden while you play — click from memory.
            </p>
          )}
        </div>

        {/* Control panel */}
        <Card className="h-fit">
          <CardContent className="space-y-5 pt-6">
            {phase === 'playing' ? (
              <>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Find this square</div>
                  <div className="mt-1 font-mono text-5xl font-bold tabular-nums text-primary-600">
                    {target}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Timer className="h-4 w-4" />
                    <span className="tabular-nums">{timeLeft}s</span>
                  </span>
                  <span className="font-medium">
                    Score: <span className="tabular-nums">{score}</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary-600 transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                {phase === 'done' && (
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <div className="text-sm text-muted-foreground">You found</div>
                    <div className="text-4xl font-bold tabular-nums text-primary-600">{score}</div>
                    <div className="text-sm text-muted-foreground">
                      square{score === 1 ? '' : 's'} in {ROUND_SECONDS}s
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 text-sm font-medium">Play as</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['white', 'black'] as const).map((side) => (
                      <Button
                        key={side}
                        variant={orientation === side ? 'default' : 'outline'}
                        onClick={() => setOrientation(side)}
                        className="capitalize"
                      >
                        {side}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Practise both sides — the board flips, and so do the coordinates.
                  </p>
                </div>

                <Button size="lg" className="w-full" onClick={start}>
                  {phase === 'done' ? (
                    <>
                      <RotateCcw className="mr-2 h-5 w-5" />
                      Play again
                    </>
                  ) : (
                    'Start'
                  )}
                </Button>
              </>
            )}

            <div
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm',
                'text-muted-foreground'
              )}
            >
              <Trophy className="h-4 w-4 text-yellow-500" />
              Best: <span className="font-bold tabular-nums text-foreground">{best}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
