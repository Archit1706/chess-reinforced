'use client';

import React, { useCallback, useRef, useState } from 'react';
import type { Move } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { analyzeGame } from '@/lib/analysis';
import { getMoveClassificationColor } from '@/lib/chess';
import type { GameAnalysis, MoveClassification } from '@/types/chess';
import { BarChart3, Loader2, X, AlertTriangle, TrendingUp } from 'lucide-react';

interface GameReviewProps {
  /** Verbose chess.js history (e.g. from the game store). */
  moves: Move[];
  /** Jump the board to the position after ply `index`. */
  onSelectMove?: (index: number) => void;
  /** Analysis depth per position (lower = faster). */
  depth?: number;
  className?: string;
}

type Status = 'idle' | 'analyzing' | 'done' | 'error';

const CLASSIFICATION_LABEL: Record<MoveClassification, string> = {
  best: 'Best',
  excellent: 'Excellent',
  good: 'Good',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
  book: 'Book',
};

/** White-POV eval for display; shows mates as "#". */
function formatWhiteEval(cp: number): string {
  if (Math.abs(cp) >= 20_000) return cp > 0 ? '#' : '-#';
  const pawns = cp / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

/**
 * Runs a full-game Stockfish review and renders accuracy, a blunder/mistake/
 * inaccuracy summary, and a clickable move-by-move breakdown.
 */
export function GameReview({ moves, onSelectMove, depth = 12, className }: GameReviewProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<GameAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const startReview = useCallback(async () => {
    if (moves.length === 0) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('analyzing');
    setError(null);
    setProgress({ done: 0, total: moves.length + 1 });

    try {
      const analysis = await analyzeGame(moves, {
        depth,
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setResult(analysis);
      setStatus('done');
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      console.error('Game review failed:', e);
      setError('Analysis failed. Please try again.');
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  }, [moves, depth]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  if (status === 'idle' || status === 'error') {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-sm text-muted-foreground">
          Review the whole game with Stockfish: per-move accuracy and a breakdown of
          inaccuracies, mistakes, and blunders.
        </p>
        {error && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </p>
        )}
        <Button onClick={startReview} disabled={moves.length === 0}>
          <BarChart3 className="h-4 w-4 mr-2" />
          {moves.length === 0 ? 'No moves to review' : 'Review game'}
        </Button>
      </div>
    );
  }

  if (status === 'analyzing') {
    const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing… {progress.done}/{progress.total}
          </span>
          <Button variant="ghost" size="sm" onClick={cancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
        </div>
        <Progress value={pct} />
      </div>
    );
  }

  // status === 'done'
  if (!result) return null;
  return (
    <div className={cn('space-y-4', className)}>
      {/* Accuracy per side */}
      <div className="grid grid-cols-2 gap-3">
        <AccuracyCard label="White" accuracy={result.accuracy.white} acl={result.averageCentipawnLoss.white} />
        <AccuracyCard label="Black" accuracy={result.accuracy.black} acl={result.averageCentipawnLoss.black} />
      </div>

      {/* Mistake summary */}
      <div className="flex items-center gap-2 text-sm">
        <SummaryPill color="#f7c631" label="Inaccuracies" count={result.inaccuracies} />
        <SummaryPill color="#ffa459" label="Mistakes" count={result.mistakes} />
        <SummaryPill color="#fa412d" label="Blunders" count={result.blunders} />
      </div>

      {/* Move-by-move */}
      <div className="max-h-[320px] overflow-y-auto rounded-lg border divide-y">
        {result.moves.map((m, i) => {
          const moveNumber = Math.floor(i / 2) + 1;
          const isWhite = i % 2 === 0;
          const notable =
            m.classification === 'inaccuracy' ||
            m.classification === 'mistake' ||
            m.classification === 'blunder';
          return (
            <button
              key={i}
              onClick={() => onSelectMove?.(i)}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/60 text-left"
            >
              <span className="w-10 text-muted-foreground tabular-nums">
                {isWhite ? `${moveNumber}.` : `${moveNumber}…`}
              </span>
              <span className="w-14 font-medium font-mono">{m.move.san}</span>
              <span
                className="inline-flex items-center gap-1.5 flex-1"
                style={{ color: getMoveClassificationColor(m.classification) }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getMoveClassificationColor(m.classification) }}
                />
                {CLASSIFICATION_LABEL[m.classification]}
                {notable && m.centipawnLoss > 0 && (
                  <span className="text-muted-foreground">(-{(m.centipawnLoss / 100).toFixed(1)})</span>
                )}
              </span>
              <span className="w-12 text-right font-mono text-muted-foreground tabular-nums">
                {formatWhiteEval(m.evaluation)}
              </span>
            </button>
          );
        })}
      </div>

      <Button variant="outline" size="sm" onClick={startReview}>
        <BarChart3 className="h-4 w-4 mr-2" />
        Re-run review
      </Button>
    </div>
  );
}

function AccuracyCard({ label, accuracy, acl }: { label: string; accuracy: number; acl: number }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <div className="text-xs text-muted-foreground">{label} Accuracy</div>
      <div className="text-2xl font-bold flex items-center justify-center gap-1">
        <TrendingUp className="h-4 w-4 text-primary-600" />
        {accuracy}%
      </div>
      <div className="text-xs text-muted-foreground">avg loss {acl} cp</div>
    </div>
  );
}

function SummaryPill({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-semibold tabular-nums">{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
