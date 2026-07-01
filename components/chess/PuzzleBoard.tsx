'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { ChessBoard } from './ChessBoard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseUciMove } from '@/lib/chess';
import {
  Lightbulb,
  Check,
  X,
  RotateCcw,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface PuzzleBoardProps {
  fen: string;
  moves: string[]; // Correct move sequence in UCI format
  rating?: number;
  themes?: string[];
  onSolved?: () => void;
  onFailed?: () => void;
  onSkip?: () => void;
  showRating?: boolean;
  showHintButton?: boolean;
  /**
   * When true (default), the solved banner auto-advances via `onSkip` after
   * AUTO_ADVANCE_MS. Set to `false` for slow-review modes (spaced repetition,
   * daily) where you want the user to sit with the final position and click
   * Next manually.
   */
  autoAdvance?: boolean;
  className?: string;
}

type PuzzleState = 'playing' | 'correct' | 'incorrect' | 'solved';

// How long the winning move stays on the board (green flash) before the
// "Solved!" panel appears — so the move is visible, not snapped away instantly.
const SOLVE_REVEAL_MS = 700;
// How long the solved banner stays visible before auto-advancing (only when
// `onSkip` is supplied — i.e. there's somewhere to advance to).
const AUTO_ADVANCE_MS = 1800;
// How long the opponent's in-between reply waits, so the user can follow it.
const OPPONENT_REPLY_MS = 450;

/**
 * Interactive puzzle board component
 * Validates user moves against the solution and provides feedback
 */
export function PuzzleBoard({
  fen,
  moves,
  rating,
  themes,
  onSolved,
  onFailed,
  onSkip,
  showRating = true,
  showHintButton = true,
  autoAdvance = true,
  className,
}: PuzzleBoardProps) {
  // Game state
  const [game] = useState(() => new Chess(fen));
  const [currentFen, setCurrentFen] = useState(fen);
  const [moveIndex, setMoveIndex] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>('playing');
  const [showHint, setShowHint] = useState(false);
  // Number of times the user pressed "Show hint" for this puzzle instance.
  const [hintsUsed, setHintsUsed] = useState(0);
  // Number of wrong moves the user made before finding the solution. Distinct
  // from `hintsUsed` — a wrong move is a mistake, not a hint request.
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Track pending timers + mount status so a fast unmount/skip can't fire
  // setState callbacks (or double-call onSolved) after the board is gone.
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const mountedRef = useRef(true);
  const solvedFiredRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const timers = timersRef.current;
    return () => {
      mountedRef.current = false;
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  /** Schedule a callback that no-ops if the board has already unmounted. */
  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      if (mountedRef.current) fn();
    }, ms);
    timersRef.current.add(id);
    return id;
  }, []);

  /** Fire `onSolved` at most once for this puzzle instance. */
  const fireSolved = useCallback(() => {
    if (solvedFiredRef.current) return;
    solvedFiredRef.current = true;
    onSolved?.();
  }, [onSolved]);

  // Solver's color — SNAPSHOT at mount from the initial FEN. Reading
  // `game.turn()` on every render would flip the board mid-puzzle every time
  // the engine's in-between reply lands (turn flips → orientation prop flips
  // → board rotates for ~500ms → turn flips back → board rotates again). We
  // want the perspective to stay fixed to the solver's side for the whole
  // puzzle.
  const [playerColor] = useState<'w' | 'b'>(() => game.turn());

  // Auto-advance once the solved banner has been visible for AUTO_ADVANCE_MS —
  // but only when there's a "next" to advance to (`onSkip` provided) AND the
  // caller opted into auto-advance (`autoAdvance`). Review-style modes turn
  // this off so the user studies the final position and clicks Next manually.
  useEffect(() => {
    if (puzzleState !== 'solved' || !onSkip || !autoAdvance) return;
    const timers = timersRef.current;
    const id = safeTimeout(() => {
      onSkip();
    }, AUTO_ADVANCE_MS);
    return () => {
      clearTimeout(id);
      timers.delete(id);
    };
  }, [puzzleState, onSkip, autoAdvance, safeTimeout]);

  // Make the first move (opponent's move) to set up the puzzle
  useEffect(() => {
    if (moves.length > 0 && moveIndex === 0) {
      // In puzzles, the first position already includes the opponent's last move
      // The player needs to find the best response
      // Sometimes puzzles start with the opponent's move that we need to show first
    }
  }, [moves, moveIndex]);

  // Handle user move
  const handleMove = useCallback(
    (from: Square, to: Square, promotion?: PieceSymbol): boolean => {
      if (puzzleState !== 'playing') return false;

      // Get the expected move
      const expectedMoveUci = moves[moveIndex];
      if (!expectedMoveUci) return false;

      const expected = parseUciMove(expectedMoveUci);

      // Check if the move matches
      const userMoveUci = `${from}${to}${promotion || ''}`;
      const isCorrect =
        from === expected.from &&
        to === expected.to &&
        (expected.promotion ? promotion === expected.promotion : true);

      if (isCorrect) {
        // Make the move
        try {
          game.move({ from, to, promotion: promotion || undefined });
          setCurrentFen(game.fen());
          setLastMove({ from, to });

          // Check if puzzle is complete
          if (moveIndex >= moves.length - 1) {
            // Flash the winning move green first, THEN reveal the solved panel,
            // so the user sees their move land instead of the board vanishing.
            setPuzzleState('correct');
            safeTimeout(() => {
              setPuzzleState('solved');
              fireSolved();
            }, SOLVE_REVEAL_MS);
          } else {
            // Show correct feedback briefly
            setPuzzleState('correct');

            // Make opponent's response after a short delay
            safeTimeout(() => {
              const opponentMoveUci = moves[moveIndex + 1];
              if (opponentMoveUci) {
                const oppMove = parseUciMove(opponentMoveUci);
                try {
                  game.move({
                    from: oppMove.from,
                    to: oppMove.to,
                    promotion: oppMove.promotion,
                  });
                } catch {
                  // Skip a malformed engine reply rather than crashing the board.
                  return;
                }
                setCurrentFen(game.fen());
                setLastMove({ from: oppMove.from, to: oppMove.to });
                setMoveIndex(moveIndex + 2);

                // Check if that was the last move
                if (moveIndex + 2 >= moves.length) {
                  setPuzzleState('correct');
                  safeTimeout(() => {
                    setPuzzleState('solved');
                    fireSolved();
                  }, SOLVE_REVEAL_MS);
                } else {
                  setPuzzleState('playing');
                }
              }
            }, OPPONENT_REPLY_MS);
          }

          return true;
        } catch {
          return false;
        }
      } else {
        // Wrong move — count as a mistake, NOT as a hint.
        setPuzzleState('incorrect');
        setWrongAttempts((n) => n + 1);
        onFailed?.();

        // Reset after showing feedback
        safeTimeout(() => {
          setPuzzleState('playing');
        }, 1000);

        return false;
      }
    },
    [game, moves, moveIndex, puzzleState, onFailed, safeTimeout, fireSolved]
  );

  // Show hint
  const handleShowHint = () => {
    setShowHint(true);
    setHintsUsed((h) => h + 1);
    // Hide hint after 3 seconds
    safeTimeout(() => setShowHint(false), 3000);
  };

  // Retry puzzle
  const handleRetry = () => {
    // Clear any pending flash/opponent-reply timers from the previous attempt.
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
    solvedFiredRef.current = false;
    game.load(fen);
    setCurrentFen(fen);
    setMoveIndex(0);
    setPuzzleState('playing');
    setShowHint(false);
    setLastMove(null);
    // Reset per-attempt counters so a fresh retry doesn't carry over the
    // hints/mistakes from the previous failed try.
    setHintsUsed(0);
    setWrongAttempts(0);
  };

  // Get hint highlight
  const getHintHighlight = () => {
    if (!showHint || puzzleState !== 'playing') return undefined;

    const expectedMove = moves[moveIndex];
    if (!expectedMove) return undefined;

    const { from } = parseUciMove(expectedMove);
    return {
      [from]: { backgroundColor: 'rgba(255, 255, 0, 0.5)' },
    };
  };

  // Get feedback colors
  const getFeedbackStyles = () => {
    if (puzzleState === 'correct') {
      return { backgroundColor: 'rgba(34, 197, 94, 0.3)' };
    }
    if (puzzleState === 'incorrect') {
      return { backgroundColor: 'rgba(239, 68, 68, 0.3)' };
    }
    return {};
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Puzzle info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showRating && rating && (
            <Badge variant="outline" className="font-mono">
              <Zap className="h-3 w-3 mr-1" />
              {rating}
            </Badge>
          )}
          {themes && themes.length > 0 && (
            <div className="flex gap-1">
              {themes.slice(0, 2).map((theme) => (
                <Badge key={theme} variant="secondary" className="text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Badge
          variant={
            puzzleState === 'solved'
              ? 'success'
              : puzzleState === 'incorrect'
              ? 'destructive'
              : 'secondary'
          }
        >
          {playerColor === 'w' ? 'White' : 'Black'} to play
        </Badge>
      </div>

      {/* Explicit instruction so the goal is always clear */}
      {puzzleState === 'playing' && (
        <p className="text-sm text-muted-foreground -mt-2">
          Find the best move for {playerColor === 'w' ? 'White' : 'Black'}
          {moves.length > 2 ? ' — there’s more than one move to find.' : '.'}
        </p>
      )}

      {/* Chess board with feedback overlay */}
      <div className="relative">
        <ChessBoard
          customFen={currentFen}
          interactive={puzzleState === 'playing'}
          onMove={handleMove}
          // Drive selection / legal-move highlighting from THIS puzzle's chess
          // instance, not the global play-page game (was the source of the
          // "wrong color highlights" bug on Black-to-move puzzles).
          localGame={game}
          boardOrientation={playerColor === 'b' ? 'black' : 'white'}
          customSquareStyles={{
            ...getHintHighlight(),
            ...(lastMove
              ? {
                  [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                  [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                }
              : {}),
          }}
        />

        {/* Feedback overlay */}
        {(puzzleState === 'correct' || puzzleState === 'incorrect') && (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center pointer-events-none',
              'animate-in fade-in zoom-in-95 duration-200'
            )}
            style={getFeedbackStyles()}
          >
            {puzzleState === 'correct' && (
              <div className="flex items-center gap-2 bg-green-500 text-white px-5 py-3 rounded-full shadow-lg">
                <Check className="h-7 w-7" />
                <span className="text-lg font-bold">Correct!</span>
              </div>
            )}
            {puzzleState === 'incorrect' && (
              <div className="flex items-center gap-2 bg-red-500 text-white px-5 py-3 rounded-full shadow-lg">
                <X className="h-7 w-7" />
                <span className="text-lg font-bold">Try again</span>
              </div>
            )}
          </div>
        )}

        {/* Solved banner — translucent, keeps the board visible so the user
            sees the winning move land. Auto-advances if onSkip is provided. */}
        {puzzleState === 'solved' && (
          <div
            className={cn(
              'absolute top-2 left-2 right-2 z-10 rounded-lg p-3 shadow-xl backdrop-blur',
              'flex items-center justify-between gap-3 flex-wrap',
              'bg-green-500/90 text-white',
              'animate-in slide-in-from-top-2 fade-in duration-300'
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="rounded-full bg-white/20 p-1 shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold leading-tight">
                  {hintsUsed === 0 && wrongAttempts === 0
                    ? 'Puzzle solved — first try!'
                    : 'Puzzle solved!'}
                </div>
                {(hintsUsed > 0 || wrongAttempts > 0) && (
                  <div className="text-xs opacity-90 leading-tight">
                    {[
                      hintsUsed > 0 &&
                        `${hintsUsed} hint${hintsUsed === 1 ? '' : 's'}`,
                      wrongAttempts > 0 &&
                        `${wrongAttempts} wrong attempt${wrongAttempts === 1 ? '' : 's'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                <RotateCcw className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Retry</span>
              </Button>
              {onSkip && (
                <Button
                  size="sm"
                  onClick={onSkip}
                  className="bg-white text-green-700 hover:bg-white/90"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {showHintButton && puzzleState === 'playing' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowHint}
            disabled={showHint}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {showHint ? 'Hint shown' : 'Show hint'}
          </Button>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleRetry}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={onSkip}>
              Skip
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
