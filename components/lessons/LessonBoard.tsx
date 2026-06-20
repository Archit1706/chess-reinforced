'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square } from 'chess.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { framesFromMoves } from './lessonDemos';

const BOARD_STYLE = {
  customDarkSquareStyle: { backgroundColor: '#b58863' },
  customLightSquareStyle: { backgroundColor: '#f0d9b5' },
} as const;

interface LessonBoardProps {
  /** Explicit FEN frames to animate through (overrides moves). */
  frames?: string[];
  /** Legal SAN/UCI moves from `fen`; expanded to frames when `frames` is absent. */
  moves?: string[];
  /** Starting FEN (interactive sandbox, or animation start). */
  fen?: string;
  /** Let the reader drag legal moves from `fen`. */
  interactive?: boolean;
  /** Auto-play the animation on mount. */
  autoPlay?: boolean;
  flip?: boolean;
  caption?: string;
  boardWidth?: number;
  className?: string;
}

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Visual learning aid for lessons. Two modes:
 *  - animate: steps through a sequence of positions (play/pause/step/loop)
 *  - interactive: a sandbox where the reader drags legal moves (chess.js-validated)
 */
export function LessonBoard({
  frames,
  moves,
  fen,
  interactive = false,
  autoPlay = false,
  flip = false,
  caption,
  boardWidth = 360,
  className,
}: LessonBoardProps) {
  const orientation = flip ? 'black' : 'white';

  if (interactive) {
    return (
      <InteractiveBoard
        startFen={fen ?? START_FEN}
        orientation={orientation}
        caption={caption}
        boardWidth={boardWidth}
        className={className}
      />
    );
  }

  const resolvedFrames =
    frames && frames.length > 0
      ? frames
      : moves && moves.length > 0
        ? framesFromMoves(fen, moves)
        : [fen ?? START_FEN];

  return (
    <AnimatedBoard
      frames={resolvedFrames}
      orientation={orientation}
      autoPlay={autoPlay}
      caption={caption}
      boardWidth={boardWidth}
      className={className}
    />
  );
}

function AnimatedBoard({
  frames,
  orientation,
  autoPlay,
  caption,
  boardWidth,
  className,
}: {
  frames: string[];
  orientation: 'white' | 'black';
  autoPlay: boolean;
  caption?: string;
  boardWidth: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoPlay && frames.length > 1);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= frames.length - 1) return 0; // loop
        return i + 1;
      });
    }, 1100);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, frames.length]);

  const single = frames.length <= 1;

  return (
    <figure className={cn('not-prose my-4 inline-block', className)}>
      <Chessboard
        position={frames[index]}
        boardWidth={boardWidth}
        boardOrientation={orientation}
        arePiecesDraggable={false}
        animationDuration={400}
        {...BOARD_STYLE}
      />
      {!single && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setIndex((i) => Math.max(0, i - 1)); }} aria-label="Step back">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPlaying((p) => !p)}>
            {playing ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {playing ? 'Pause' : 'Play'}
          </Button>
          <Button variant="outline" size="icon" onClick={() => { setPlaying(false); setIndex((i) => Math.min(frames.length - 1, i + 1)); }} aria-label="Step forward">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setPlaying(false); setIndex(0); }} aria-label="Restart">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
            {index + 1}/{frames.length}
          </span>
        </div>
      )}
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground max-w-[420px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function InteractiveBoard({
  startFen,
  orientation,
  caption,
  boardWidth,
  className,
}: {
  startFen: string;
  orientation: 'white' | 'black';
  caption?: string;
  boardWidth: number;
  className?: string;
}) {
  const game = useMemo(() => new Chess(startFen), [startFen]);
  const [fen, setFen] = useState(startFen);
  const [moveStyles, setMoveStyles] = useState<Record<string, React.CSSProperties>>({});

  const clearHints = useCallback(() => setMoveStyles({}), []);

  const showLegalMoves = useCallback(
    (square: Square) => {
      const moves = game.moves({ square, verbose: true });
      if (moves.length === 0) return;
      const styles: Record<string, React.CSSProperties> = {
        [square]: { backgroundColor: 'rgba(130, 151, 105, 0.5)' },
      };
      for (const m of moves) {
        styles[m.to] = {
          background:
            'radial-gradient(circle, rgba(0,0,0,0.25) 22%, transparent 24%)',
          borderRadius: '50%',
        };
      }
      setMoveStyles(styles);
    },
    [game]
  );

  const onDrop = useCallback(
    (from: string, to: string) => {
      try {
        const move = game.move({ from, to, promotion: 'q' });
        if (!move) return false;
        setFen(game.fen());
        clearHints();
        return true;
      } catch {
        return false;
      }
    },
    [game, clearHints]
  );

  const reset = useCallback(() => {
    game.load(startFen);
    setFen(startFen);
    clearHints();
  }, [game, startFen, clearHints]);

  return (
    <figure className={cn('not-prose my-4 inline-block', className)}>
      <Chessboard
        position={fen}
        boardWidth={boardWidth}
        boardOrientation={orientation}
        onPieceDrop={onDrop}
        onPieceDragBegin={(_piece, square) => showLegalMoves(square as Square)}
        onSquareClick={(square) => showLegalMoves(square as Square)}
        customSquareStyles={moveStyles}
        animationDuration={200}
        {...BOARD_STYLE}
      />
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Hand className="h-3.5 w-3.5" />
          Drag the pieces — only legal moves are allowed
        </span>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
      {caption && (
        <figcaption className="mt-1 text-center text-sm text-muted-foreground max-w-[420px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
