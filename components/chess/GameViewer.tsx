'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, AlertTriangle } from 'lucide-react';

interface GameViewerProps {
  pgn: string;
  orientation?: 'white' | 'black';
  boardWidth?: number;
  className?: string;
}

/**
 * Self-contained PGN replay: parses the game with chess.js, precomputes the
 * position after every ply, and lets the user step through with buttons,
 * keyboard arrows, or by clicking a move. No global store coupling.
 */
export function GameViewer({ pgn, orientation = 'white', boardWidth = 480, className }: GameViewerProps) {
  // Parse once: SAN move list + FEN after each ply (index 0 = start position).
  const { sans, fens, error } = useMemo(() => {
    try {
      const parser = new Chess();
      parser.loadPgn(pgn);
      const sanList = parser.history();
      const replay = new Chess();
      const fenList = [replay.fen()];
      for (const san of sanList) {
        replay.move(san);
        fenList.push(replay.fen());
      }
      return { sans: sanList, fens: fenList, error: false };
    } catch {
      return { sans: [] as string[], fens: [new Chess().fen()], error: true };
    }
  }, [pgn]);

  const [ply, setPly] = useState(0);
  const [boardRef, boardContainerWidth] = useContainerWidth<HTMLDivElement>();
  const resolvedWidth =
    boardContainerWidth > 0 ? Math.min(boardWidth, boardContainerWidth) : boardWidth;

  const goFirst = useCallback(() => setPly(0), []);
  const goPrev = useCallback(() => setPly((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(() => setPly((p) => Math.min(sans.length, p + 1)), [sans.length]);
  const goLast = useCallback(() => setPly(sans.length), [sans.length]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowUp') goFirst();
      else if (e.key === 'ArrowDown') goLast();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, goFirst, goLast]);

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-red-500', className)}>
        <AlertTriangle className="h-4 w-4" />
        This game&apos;s notation could not be read.
      </div>
    );
  }

  // Group SAN moves into numbered pairs for the move list.
  const rows: { number: number; white?: string; black?: string }[] = [];
  for (let i = 0; i < sans.length; i += 2) {
    rows.push({ number: i / 2 + 1, white: sans[i], black: sans[i + 1] });
  }

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[1fr_220px]', className)}>
      <div className="space-y-3 min-w-0">
        <div ref={boardRef} className="w-full overflow-hidden" style={{ maxWidth: boardWidth }}>
          <Chessboard
            position={fens[ply]}
            boardWidth={resolvedWidth}
            boardOrientation={orientation}
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: '#b58863' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" onClick={goFirst} disabled={ply === 0} aria-label="First move">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goPrev} disabled={ply === 0} aria-label="Previous move">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[72px] text-center text-sm text-muted-foreground tabular-nums">
            {ply} / {sans.length}
          </span>
          <Button variant="outline" size="icon" onClick={goNext} disabled={ply === sans.length} aria-label="Next move">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goLast} disabled={ply === sans.length} aria-label="Last move">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Move list */}
      <div className="rounded-lg border max-h-[460px] overflow-y-auto text-sm">
        {rows.map((row) => (
          <div key={row.number} className="flex items-stretch border-b last:border-0">
            <span className="w-9 shrink-0 px-2 py-1.5 text-muted-foreground tabular-nums bg-muted/40">
              {row.number}.
            </span>
            <MoveCell san={row.white} active={ply === row.number * 2 - 1} onClick={() => setPly(row.number * 2 - 1)} />
            <MoveCell san={row.black} active={ply === row.number * 2} onClick={() => setPly(row.number * 2)} />
          </div>
        ))}
        {rows.length === 0 && (
          <p className="px-3 py-2 text-muted-foreground">No moves.</p>
        )}
      </div>
    </div>
  );
}

function MoveCell({ san, active, onClick }: { san?: string; active: boolean; onClick: () => void }) {
  if (!san) return <span className="flex-1 px-2 py-1.5" />;
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 px-2 py-1.5 text-left font-mono hover:bg-muted transition-colors',
        active && 'bg-primary-600 text-white hover:bg-primary-600'
      )}
    >
      {san}
    </button>
  );
}
