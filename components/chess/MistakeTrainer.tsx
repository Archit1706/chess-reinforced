'use client';

import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PuzzleBoard } from './PuzzleBoard';
import { getLocalBestMove } from '@/lib/local-engine';
import { cn } from '@/lib/utils';
import type { GameAnalysis, MoveClassification } from '@/types/chess';

interface MistakeTrainerProps {
  analysis: GameAnalysis;
  /** Which side the user played, so only their mistakes become puzzles. */
  playerColor: 'white' | 'black';
  /** Starting FEN of the game (defaults to the standard initial position). */
  startFen?: string;
  className?: string;
}

interface MistakePuzzle {
  ply: number;
  fen: string; // position before the player's mistake (player to move)
  solution: string[]; // engine best move in UCI
  played: string; // SAN of the move actually played
  classification: MoveClassification;
}

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/**
 * Turns a game's analysis into "find the better move" puzzles from the user's
 * own mistakes and blunders. Pure-derived from the analysis (no DB) and solved
 * on the existing PuzzleBoard.
 */
export function MistakeTrainer({ analysis, playerColor, startFen, className }: MistakeTrainerProps) {
  const puzzles = useMemo<MistakePuzzle[]>(() => {
    const playerIsWhite = playerColor === 'white';
    const out: MistakePuzzle[] = [];
    analysis.moves.forEach((m, i) => {
      const moverIsWhite = i % 2 === 0;
      if (moverIsWhite !== playerIsWhite) return;
      if (m.classification !== 'blunder' && m.classification !== 'mistake') return;

      const fenBefore = i === 0 ? startFen ?? DEFAULT_FEN : analysis.moves[i - 1].fen;

      // Prefer the engine's best move; fall back to the local engine at full
      // strength so the trainer still works when Stockfish never loaded.
      const best = m.bestMove ?? getLocalBestMove(fenBefore, 2200) ?? undefined;
      if (!best) return;

      // Skip when the "best" move is the one actually played (no improvement).
      const playedUci = `${m.move.from}${m.move.to}${m.move.promotion ?? ''}`;
      if (playedUci === best) return;

      out.push({
        ply: i,
        fen: fenBefore,
        solution: [best],
        played: m.move.san,
        classification: m.classification,
      });
    });
    return out;
  }, [analysis, playerColor, startFen]);

  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState<Set<number>>(new Set());

  if (puzzles.length === 0) {
    return (
      <div className={cn('text-center py-6 text-sm text-muted-foreground', className)}>
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
        No mistakes to train here — well played!
      </div>
    );
  }

  const current = puzzles[Math.min(index, puzzles.length - 1)];
  const isSolved = solved.has(current.ply);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4 text-primary-600" />
          <span className="font-medium">
            Mistake {index + 1} of {puzzles.length}
          </span>
          <Badge
            variant="outline"
            className={cn(
              current.classification === 'blunder'
                ? 'text-red-500 border-red-500/40'
                : 'text-orange-500 border-orange-500/40'
            )}
          >
            {current.classification === 'blunder' ? 'Blunder' : 'Mistake'}
          </Badge>
          <span className="text-muted-foreground">· you played {current.played}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous mistake"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">
            {solved.size}/{puzzles.length} ✓
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIndex((i) => Math.min(puzzles.length - 1, i + 1))}
            disabled={index >= puzzles.length - 1}
            aria-label="Next mistake"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Find the move you should have played. {isSolved && '✓ Solved!'}
      </p>

      <PuzzleBoard
        key={`mistake-${current.ply}`}
        fen={current.fen}
        moves={current.solution}
        showRating={false}
        showHintButton
        onSolved={() => {
          setSolved((prev) => new Set(prev).add(current.ply));
        }}
      />

      {isSolved && index < puzzles.length - 1 && (
        <div className="text-center">
          <Button onClick={() => setIndex((i) => Math.min(puzzles.length - 1, i + 1))}>
            Next mistake
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
