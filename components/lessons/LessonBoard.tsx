'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, type PieceSymbol } from 'chess.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import { getLocalBestMove } from '@/lib/local-engine';
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Hand, Loader2 } from 'lucide-react';
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
  /**
   * Interactive mode only: after the reader moves, the board answers with an
   * engine reply (local pure-JS engine) so the sandbox plays back like a
   * mini-opponent instead of a static diagram.
   */
  respond?: boolean;
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
  respond = false,
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
        respond={respond}
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
  const [boardRef, containerWidth] = useContainerWidth<HTMLElement>();
  const width = containerWidth > 0 ? Math.min(boardWidth, containerWidth) : boardWidth;

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
    <figure
      ref={boardRef}
      className={cn('not-prose my-4 w-full mx-auto', className)}
      style={{ maxWidth: boardWidth }}
    >
      <Chessboard
        position={frames[index]}
        boardWidth={width}
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

/** Delay before the board answers back, so the reader's move settles visually. */
const REPLY_DELAY_MS = 550;

function InteractiveBoard({
  startFen,
  orientation,
  respond,
  caption,
  boardWidth,
  className,
}: {
  startFen: string;
  orientation: 'white' | 'black';
  respond: boolean;
  caption?: string;
  boardWidth: number;
  className?: string;
}) {
  const game = useMemo(() => new Chess(startFen), [startFen]);
  const [fen, setFen] = useState(startFen);
  const [thinking, setThinking] = useState(false);
  const [moveStyles, setMoveStyles] = useState<Record<string, React.CSSProperties>>({});
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [boardRef, containerWidth] = useContainerWidth<HTMLElement>();
  const width = containerWidth > 0 ? Math.min(boardWidth, containerWidth) : boardWidth;

  // Clear a pending engine reply if the board unmounts mid-think.
  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

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

  /** In respond mode, answer the reader's move with a light engine reply. */
  const scheduleReply = useCallback(() => {
    if (!respond || game.isGameOver()) return;
    setThinking(true);
    replyTimer.current = setTimeout(() => {
      try {
        const uci = getLocalBestMove(game.fen(), 1200);
        if (uci) {
          game.move({
            from: uci.slice(0, 2),
            to: uci.slice(2, 4),
            promotion: (uci[4] as PieceSymbol | undefined) || undefined,
          });
          setFen(game.fen());
        }
      } catch {
        // A failed reply just leaves it the reader's move again — never crash.
      } finally {
        setThinking(false);
      }
    }, REPLY_DELAY_MS);
  }, [respond, game]);

  const onDrop = useCallback(
    (from: string, to: string) => {
      if (thinking) return false; // wait for the board's answer
      try {
        const move = game.move({ from, to, promotion: 'q' });
        if (!move) return false;
        setFen(game.fen());
        clearHints();
        scheduleReply();
        return true;
      } catch {
        return false;
      }
    },
    [game, clearHints, scheduleReply, thinking]
  );

  const reset = useCallback(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    game.load(startFen);
    setFen(startFen);
    clearHints();
  }, [game, startFen, clearHints]);

  const turn = fen.split(' ')[1] === 'b' ? 'Black' : 'White';
  const gameOver = game.isGameOver();

  return (
    <figure
      ref={boardRef}
      className={cn('not-prose my-4 w-full mx-auto', className)}
      style={{ maxWidth: boardWidth }}
    >
      <Chessboard
        position={fen}
        boardWidth={width}
        boardOrientation={orientation}
        onPieceDrop={onDrop}
        onPieceDragBegin={(_piece, square) => showLegalMoves(square as Square)}
        onSquareClick={(square) => showLegalMoves(square as Square)}
        customSquareStyles={moveStyles}
        animationDuration={200}
        {...BOARD_STYLE}
      />
      <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
        {/* Explicit call to action: whose move is it? */}
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            gameOver
              ? 'text-muted-foreground'
              : thinking
                ? 'text-muted-foreground'
                : 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-500'
          )}
        >
          {gameOver ? (
            'Game over — hit Reset to try again'
          ) : thinking ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Thinking…
            </>
          ) : (
            <>
              <Hand className="h-3 w-3" />
              Your move — {turn} to play
            </>
          )}
        </span>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        Drag the pieces — only legal moves are allowed
        {respond ? '. The board answers back!' : ''}
      </p>
      {caption && (
        <figcaption className="mt-1 text-center text-sm text-muted-foreground max-w-[420px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
