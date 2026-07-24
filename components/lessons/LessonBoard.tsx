'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, type PieceSymbol, type Move } from 'chess.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import { getLocalBestMove } from '@/lib/local-engine';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Hand,
  Loader2,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Eye,
} from 'lucide-react';
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
  /**
   * Interactive mode only: turns the board into a checkable challenge. The
   * reader must play one of these moves (SAN like `exd5`/`Nf6+`, or UCI like
   * `d4d5`); a correct move is confirmed, a wrong-but-legal move is taken back
   * with a "try again" prompt. When set, `respond` is ignored (a challenge
   * verifies one move rather than playing on).
   */
  solution?: string[];
  /** Challenge only: a nudge revealed by the "Hint" button. */
  hint?: string;
  /** Challenge only: a short explanation shown after the correct move. */
  success?: string;
  /** Challenge only: the objective shown above the board. */
  goal?: string;
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
  solution,
  hint,
  success,
  goal,
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
        solution={solution}
        hint={hint}
        success={success}
        goal={goal}
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

/** Strip check/mate/annotation glyphs and case for lenient move comparison. */
function normalizeMoveToken(s: string): string {
  return s.replace(/[+#!?]/g, '').trim().toLowerCase();
}

function InteractiveBoard({
  startFen,
  orientation,
  respond,
  solution,
  hint,
  success,
  goal,
  caption,
  boardWidth,
  className,
}: {
  startFen: string;
  orientation: 'white' | 'black';
  respond: boolean;
  solution?: string[];
  hint?: string;
  success?: string;
  goal?: string;
  caption?: string;
  boardWidth: number;
  className?: string;
}) {
  const game = useMemo(() => new Chess(startFen), [startFen]);
  const [fen, setFen] = useState(startFen);
  const [thinking, setThinking] = useState(false);
  const [moveStyles, setMoveStyles] = useState<Record<string, React.CSSProperties>>({});
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [solved, setSolved] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [boardRef, containerWidth] = useContainerWidth<HTMLElement>();
  const width = containerWidth > 0 ? Math.min(boardWidth, containerWidth) : boardWidth;

  const isChallenge = !!(solution && solution.length > 0);

  // Accepted moves, normalized once, for O(1) membership checks.
  const solutionSet = useMemo(() => {
    const set = new Set<string>();
    for (const s of solution ?? []) set.add(normalizeMoveToken(s));
    return set;
  }, [solution]);

  // Clear a pending engine reply if the board unmounts mid-think.
  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  const clearHints = useCallback(() => setMoveStyles({}), []);

  const showLegalMoves = useCallback(
    (square: Square) => {
      if (solved) return;
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
    [game, solved]
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

  /** Does a played move match any accepted solution (by SAN or by UCI)? */
  const isSolutionMove = useCallback(
    (m: Move): boolean => {
      const candidates = [
        normalizeMoveToken(m.san),
        m.lan.toLowerCase(),
        (m.from + m.to).toLowerCase(),
        (m.from + m.to + (m.promotion ?? '')).toLowerCase(),
      ];
      return candidates.some((c) => solutionSet.has(c));
    },
    [solutionSet]
  );

  const onDrop = useCallback(
    (from: string, to: string) => {
      if (thinking || solved) return false; // wait for the answer / already solved
      let move: Move | null = null;
      try {
        move = game.move({ from, to, promotion: 'q' });
      } catch {
        return false;
      }
      if (!move) return false;

      if (isChallenge) {
        if (isSolutionMove(move)) {
          setFen(game.fen());
          clearHints();
          setFeedback('correct');
          setSolved(true);
          return true;
        }
        // Wrong but legal: take it back so the reader can try the intended move.
        game.undo();
        setFeedback('wrong');
        clearHints();
        return false;
      }

      setFen(game.fen());
      clearHints();
      setFeedback('none');
      scheduleReply();
      return true;
    },
    [game, clearHints, scheduleReply, thinking, solved, isChallenge, isSolutionMove]
  );

  /** Play the first accepted move for the reader who's stuck. */
  const showSolution = useCallback(() => {
    const first = (solution ?? [])[0];
    if (!first) return;
    let m: Move | null = null;
    try {
      m = game.move(first); // SAN (chess.js tolerates trailing +/#)
    } catch {
      m = null;
    }
    if (!m && first.length >= 4) {
      try {
        m = game.move({
          from: first.slice(0, 2),
          to: first.slice(2, 4),
          promotion: (first[4] as PieceSymbol | undefined) || 'q',
        });
      } catch {
        m = null;
      }
    }
    if (m) {
      setFen(game.fen());
      clearHints();
      setFeedback('correct');
      setSolved(true);
    }
  }, [game, solution, clearHints]);

  const reset = useCallback(() => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    setThinking(false);
    game.load(startFen);
    setFen(startFen);
    clearHints();
    setFeedback('none');
    setSolved(false);
    setHintShown(false);
  }, [game, startFen, clearHints]);

  const turn = fen.split(' ')[1] === 'b' ? 'Black' : 'White';
  // Only checkmate/stalemate genuinely ends a drill. Many teaching boards are
  // single-piece or bare-king positions (K+N vs K, K vs K opposition) that
  // chess.js reports as game-over by *insufficient material* — those should
  // still invite the reader to move, not show a discouraging "Game over".
  const gameOver = game.isCheckmate() || game.isStalemate();

  // The status pill: solved/correct → green, wrong → amber, else the CTA.
  const showCorrect = solved || feedback === 'correct';
  let statusClass: string;
  let statusNode: React.ReactNode;
  if (showCorrect) {
    statusClass = 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-500';
    statusNode = (
      <>
        <CheckCircle2 className="h-3 w-3" />
        Correct!
      </>
    );
  } else if (feedback === 'wrong') {
    statusClass = 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-500';
    statusNode = (
      <>
        <XCircle className="h-3 w-3" />
        Not the move — try again
      </>
    );
  } else if (gameOver) {
    statusClass = 'text-muted-foreground';
    statusNode = 'Game over — hit Reset to try again';
  } else if (thinking) {
    statusClass = 'text-muted-foreground';
    statusNode = (
      <>
        <Loader2 className="h-3 w-3 animate-spin" />
        Thinking…
      </>
    );
  } else {
    statusClass = 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-500';
    statusNode = (
      <>
        <Hand className="h-3 w-3" />
        {isChallenge ? 'Your move — find it' : `Your move — ${turn} to play`}
      </>
    );
  }

  return (
    <figure
      ref={boardRef}
      className={cn('not-prose my-4 w-full mx-auto', className)}
      style={{ maxWidth: boardWidth }}
    >
      {goal && (
        <p className="mb-2 text-center text-sm font-medium text-foreground">🎯 {goal}</p>
      )}
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
      <div className="mt-2 flex items-center justify-center gap-2 flex-wrap" aria-live="polite">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            statusClass
          )}
        >
          {statusNode}
        </span>
        {isChallenge && !solved && hint && (
          <Button variant="outline" size="sm" onClick={() => setHintShown(true)} disabled={hintShown}>
            <Lightbulb className="h-4 w-4 mr-1" />
            Hint
          </Button>
        )}
        {isChallenge && !solved && (
          <Button variant="ghost" size="sm" onClick={showSolution}>
            <Eye className="h-4 w-4 mr-1" />
            Show solution
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {isChallenge && hintShown && hint && !solved && (
        <p className="mt-1 text-center text-xs text-muted-foreground">💡 {hint}</p>
      )}
      {showCorrect && success && (
        <p className="mt-1 text-center text-sm text-green-600 dark:text-green-500">{success}</p>
      )}

      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        Drag the pieces — only legal moves are allowed
        {respond && !isChallenge ? '. The board answers back!' : ''}
      </p>
      {caption && (
        <figcaption className="mt-1 text-center text-sm text-muted-foreground max-w-[420px]">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
