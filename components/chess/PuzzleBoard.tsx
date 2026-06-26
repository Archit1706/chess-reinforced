'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  className?: string;
}

type PuzzleState = 'playing' | 'correct' | 'incorrect' | 'solved';

// How long the winning move stays on the board (green flash) before the
// "Solved!" panel appears — so the move is visible, not snapped away instantly.
const SOLVE_REVEAL_MS = 700;
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
  className,
}: PuzzleBoardProps) {
  // Game state
  const [game] = useState(() => new Chess(fen));
  const [currentFen, setCurrentFen] = useState(fen);
  const [moveIndex, setMoveIndex] = useState(0);
  const [puzzleState, setPuzzleState] = useState<PuzzleState>('playing');
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Determine player color (opposite of first move's color)
  const playerColor = game.turn();

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
            setTimeout(() => {
              setPuzzleState('solved');
              onSolved?.();
            }, SOLVE_REVEAL_MS);
          } else {
            // Show correct feedback briefly
            setPuzzleState('correct');

            // Make opponent's response after a short delay
            setTimeout(() => {
              const opponentMoveUci = moves[moveIndex + 1];
              if (opponentMoveUci) {
                const oppMove = parseUciMove(opponentMoveUci);
                game.move({
                  from: oppMove.from,
                  to: oppMove.to,
                  promotion: oppMove.promotion,
                });
                setCurrentFen(game.fen());
                setLastMove({ from: oppMove.from, to: oppMove.to });
                setMoveIndex(moveIndex + 2);

                // Check if that was the last move
                if (moveIndex + 2 >= moves.length) {
                  setPuzzleState('correct');
                  setTimeout(() => {
                    setPuzzleState('solved');
                    onSolved?.();
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
        // Wrong move
        setPuzzleState('incorrect');
        setHintsUsed((h) => h + 1);
        onFailed?.();

        // Reset after showing feedback
        setTimeout(() => {
          setPuzzleState('playing');
        }, 1000);

        return false;
      }
    },
    [game, moves, moveIndex, puzzleState, onSolved, onFailed]
  );

  // Show hint
  const handleShowHint = () => {
    setShowHint(true);
    setHintsUsed((h) => h + 1);
    // Hide hint after 3 seconds
    setTimeout(() => setShowHint(false), 3000);
  };

  // Retry puzzle
  const handleRetry = () => {
    game.load(fen);
    setCurrentFen(fen);
    setMoveIndex(0);
    setPuzzleState('playing');
    setShowHint(false);
    setLastMove(null);
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

        {/* Solved overlay */}
        {puzzleState === 'solved' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
            <div className="bg-background p-6 rounded-xl text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-500">
                <Check className="h-8 w-8" />
                <span className="text-2xl font-bold">Puzzle Solved!</span>
              </div>
              {hintsUsed > 0 && (
                <p className="text-sm text-muted-foreground">
                  Hints used: {hintsUsed}
                </p>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                {onSkip && (
                  <Button onClick={onSkip}>
                    Next Puzzle
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
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
