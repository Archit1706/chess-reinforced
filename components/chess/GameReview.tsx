'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess } from 'chess.js';
import type { Move, Square } from 'chess.js';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { analyzeGame } from '@/lib/analysis';
import { getMoveClassificationColor, parseUciMove } from '@/lib/chess';
import type { AnalyzedMove, GameAnalysis, MoveClassification } from '@/types/chess';
import {
  BarChart3,
  Loader2,
  X,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  AlertCircle,
} from 'lucide-react';
import { ChessBoard } from './ChessBoard';

interface GameReviewProps {
  /** Verbose chess.js history (e.g. from the game store). */
  moves: Move[];
  /** Jump the parent's board to the position after ply `index` (optional). */
  onSelectMove?: (index: number) => void;
  /** Analysis depth per position (lower = faster). */
  depth?: number;
  /** Fires once the full-game analysis completes (e.g. to derive practice puzzles). */
  onAnalyzed?: (analysis: GameAnalysis) => void;
  /**
   * Fill the parent's height (board left, scrollable move list right on large
   * screens). Use inside a full-screen dialog; leave off for inline embeds,
   * where the component sizes to its content.
   */
  fullHeight?: boolean;
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

const CLASSIFICATION_DESC: Record<MoveClassification, string> = {
  best: "The engine's top choice.",
  excellent: 'Nearly the best move — barely worse.',
  good: 'A solid move with a small giveaway.',
  inaccuracy: 'Not the best. You handed over a small edge.',
  mistake: 'A meaningful error — a clearly better move was available.',
  blunder: 'A serious error that changes the evaluation significantly.',
  book: 'A well-known opening move.',
};

const NOTABLE = new Set<MoveClassification>(['inaccuracy', 'mistake', 'blunder']);

/** White-POV eval for display; shows mates as "#". */
function formatWhiteEval(cp: number): string {
  if (Math.abs(cp) >= 20_000) return cp > 0 ? '#' : '-#';
  const pawns = cp / 100;
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}

/** Turn a UCI move (`"e2e4"` / `"e7e8q"`) into board squares, safely. */
function uciSquares(uci: string): { from: Square; to: Square } | null {
  if (!uci || uci.length < 4) return null;
  try {
    const parsed = parseUciMove(uci);
    return { from: parsed.from, to: parsed.to };
  } catch {
    return null;
  }
}

/**
 * Runs a full-game Stockfish review and renders:
 * - Accuracy per side + summary of inaccuracies/mistakes/blunders
 * - An **eval sparkline** across the game (click any point to jump)
 * - An **interactive board** with prev/next + skip-to-next-mistake controls,
 *   drawing arrows for the move played (red) vs the engine's best (green)
 *   whenever the current move is notable
 * - Explanatory caption on mistakes
 * - Clickable move-by-move list with tooltips explaining each classification
 */
export function GameReview({
  moves,
  onSelectMove,
  depth = 12,
  onAnalyzed,
  fullHeight = false,
  className,
}: GameReviewProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<GameAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  // ply 0 = starting position; ply N = position after the Nth half-move.
  const [ply, setPly] = useState(0);
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
      // Jump to the first notable move, if any, so the user lands on
      // something interesting instead of the empty starting position.
      const firstNotable = analysis.moves.findIndex((m) => NOTABLE.has(m.classification));
      setPly(firstNotable === -1 ? 0 : firstNotable + 1);
      onAnalyzed?.(analysis);
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
  }, [moves, depth, onAnalyzed]);

  const cancel = useCallback(() => abortRef.current?.abort(), []);

  // -------- Interactive-board derived state (memoized, cheap) --------

  // Position at the current ply. `analyzedMoves[i].fen` is the FEN AFTER ply i+1;
  // for ply 0 we use the standard starting position.
  const currentFen = useMemo(() => {
    if (!result || ply === 0) return new Chess().fen();
    const idx = Math.max(0, Math.min(ply - 1, result.moves.length - 1));
    return result.moves[idx].fen;
  }, [result, ply]);

  // A Chess instance that mirrors the currently-displayed position — passed to
  // ChessBoard's `localGame` mode so highlights come from THIS position rather
  // than the global game store.
  const localGame = useMemo(() => {
    try {
      return new Chess(currentFen);
    } catch {
      return new Chess();
    }
  }, [currentFen]);

  // The move that produced the current position (null at ply 0).
  const currentMove: AnalyzedMove | null = useMemo(() => {
    if (!result || ply === 0) return null;
    return result.moves[ply - 1] ?? null;
  }, [result, ply]);

  // Arrows: red = actually played (notable only), green = engine's best (if
  // different from played). Non-notable moves show no arrows so the board
  // isn't visually noisy for good play.
  const arrows = useMemo<[Square, Square, string?][]>(() => {
    if (!currentMove) return [];
    if (!NOTABLE.has(currentMove.classification)) return [];

    const list: [Square, Square, string?][] = [];
    // Move actually played — red.
    list.push([
      currentMove.move.from as Square,
      currentMove.move.to as Square,
      'rgb(239, 68, 68)',
    ]);
    // Engine's best — green — only if we have it AND it differs from the played move.
    if (currentMove.bestMove) {
      const best = uciSquares(currentMove.bestMove);
      const playedUci = `${currentMove.move.from}${currentMove.move.to}${currentMove.move.promotion ?? ''}`;
      if (best && currentMove.bestMove !== playedUci) {
        list.push([best.from, best.to, 'rgb(34, 197, 94)']);
      }
    }
    return list;
  }, [currentMove]);

  // Ply indices with notable classifications, sorted ascending — used for
  // "next mistake" / "previous mistake" jumps.
  const notablePlies = useMemo<number[]>(() => {
    if (!result) return [];
    return result.moves
      .map((m, i) => (NOTABLE.has(m.classification) ? i + 1 : -1))
      .filter((p) => p > 0);
  }, [result]);

  const setPlyAndSync = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(moves.length, next));
      setPly(clamped);
      // Also drive the parent's board when a coupling was provided (play page).
      // Parent's `onSelectMove(i)` uses 0-based move indices; clamped-1 matches.
      if (onSelectMove && clamped > 0) onSelectMove(clamped - 1);
    },
    [moves.length, onSelectMove]
  );

  const jumpToNextNotable = useCallback(
    (direction: 1 | -1) => {
      if (notablePlies.length === 0) return;
      const target =
        direction === 1
          ? notablePlies.find((p) => p > ply)
          : [...notablePlies].reverse().find((p) => p < ply);
      if (target != null) setPlyAndSync(target);
    },
    [notablePlies, ply, setPlyAndSync]
  );

  // Keyboard navigation while the review is on screen: ←/→ step through moves,
  // ↑/↓ jump between mistakes, Home/End go to the start/end of the game.
  // Dialog (fullHeight) context only — inline embeds sit next to a GameViewer
  // that already owns the arrow keys, and two boards must not step at once.
  useEffect(() => {
    if (status !== 'done' || !fullHeight) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          setPlyAndSync(ply - 1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setPlyAndSync(ply + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          jumpToNextNotable(-1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          jumpToNextNotable(1);
          break;
        case 'Home':
          event.preventDefault();
          setPlyAndSync(0);
          break;
        case 'End':
          event.preventDefault();
          setPlyAndSync(moves.length);
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, fullHeight, ply, setPlyAndSync, jumpToNextNotable, moves.length]);

  // Auto-scroll the move list so the current move stays in view.
  const moveListRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (status !== 'done') return;
    const el = moveListRef.current?.querySelector<HTMLButtonElement>(
      `[data-ply="${ply}"]`
    );
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [ply, status]);

  // -------- Render --------

  if (status === 'idle' || status === 'error') {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-sm text-muted-foreground">
          Review the whole game with the engine: per-move accuracy plus a breakdown of
          inaccuracies, mistakes, and blunders — stepped through on an interactive board.
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

  const orientation: 'white' | 'black' = ply % 2 === 0 ? 'white' : 'black';
  const canPrev = ply > 0;
  const canNext = ply < moves.length;
  const isNotable = currentMove ? NOTABLE.has(currentMove.classification) : false;
  const bestMoveDisplay =
    currentMove?.bestMove && uciSquares(currentMove.bestMove)
      ? bestMoveSan(result, ply)
      : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          'flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,1fr)] lg:gap-6',
          fullHeight ? 'h-full min-h-0' : 'lg:items-start',
          className
        )}
      >
        {/* Board column — the star of the show, sized to the space available */}
        <div
          className={cn(
            'rounded-lg border p-3 space-y-3 min-w-0',
            fullHeight && 'lg:min-h-0 lg:flex lg:flex-col lg:justify-center'
          )}
        >
          <div
            className="mx-auto w-full"
            style={{
              maxWidth: fullHeight
                ? 'min(680px, max(280px, calc(100vh - 350px)))'
                : 480,
            }}
          >
            <ChessBoard
              customFen={currentFen}
              interactive={false}
              localGame={localGame}
              boardOrientation={orientation}
              customArrows={arrows}
              boardWidth={680}
            />
          </div>

          {/* Move caption + engine's suggestion */}
          <MoveCaption analysis={result} ply={ply} bestMoveSan={bestMoveDisplay} />

          {/* Stepper controls */}
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPlyAndSync(0)}
                  disabled={!canPrev}
                  aria-label="Go to start"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start of game</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => jumpToNextNotable(-1)}
                  disabled={notablePlies.length === 0 || !notablePlies.some((p) => p < ply)}
                  aria-label="Previous mistake"
                >
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <ChevronLeft className="h-3 w-3 -ml-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous mistake</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPlyAndSync(ply - 1)}
                  disabled={!canPrev}
                  aria-label="Previous move"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous move</TooltipContent>
            </Tooltip>

            <span className="text-xs text-muted-foreground tabular-nums min-w-[80px] text-center">
              {ply}/{moves.length}
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPlyAndSync(ply + 1)}
                  disabled={!canNext}
                  aria-label="Next move"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next move</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => jumpToNextNotable(1)}
                  disabled={notablePlies.length === 0 || !notablePlies.some((p) => p > ply)}
                  aria-label="Next mistake"
                >
                  <ChevronRight className="h-3 w-3 -mr-1" />
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next mistake</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPlyAndSync(moves.length)}
                  disabled={!canNext}
                  aria-label="Go to end"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End of game</TooltipContent>
            </Tooltip>
          </div>

          {/* Arrow legend (only visible when arrows are on the board) */}
          {isNotable && arrows.length > 0 && (
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-3 rounded" style={{ backgroundColor: 'rgb(239, 68, 68)' }} />
                Played
              </span>
              {arrows.length > 1 && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2 w-3 rounded"
                    style={{ backgroundColor: 'rgb(34, 197, 94)' }}
                  />
                  Engine&apos;s move
                </span>
              )}
            </div>
          )}
        </div>

        {/* Details column — stats on top, the move list fills what's left */}
        <div
          className={cn(
            'flex flex-col gap-3 min-w-0',
            fullHeight && 'lg:h-full lg:min-h-0'
          )}
        >
          {/* Accuracy per side */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <AccuracyCard
              label="White"
              accuracy={result.accuracy.white}
              acl={result.averageCentipawnLoss.white}
            />
            <AccuracyCard
              label="Black"
              accuracy={result.accuracy.black}
              acl={result.averageCentipawnLoss.black}
            />
          </div>

          {/* Mistake summary */}
          <div className="flex items-center gap-2 text-sm flex-wrap shrink-0">
            <SummaryPill color="#f7c631" label="Inaccuracies" count={result.inaccuracies} />
            <SummaryPill color="#ffa459" label="Mistakes" count={result.mistakes} />
            <SummaryPill color="#fa412d" label="Blunders" count={result.blunders} />
          </div>

          {/* Eval sparkline — click to jump anywhere in the game */}
          <div className="shrink-0">
            <EvalSparkline
              evals={result.moves.map((m) => m.evaluation)}
              currentPly={ply}
              onSelect={setPlyAndSync}
            />
          </div>

          {/* Move-by-move list */}
          <div
            ref={moveListRef}
            className={cn(
              'overflow-y-auto rounded-lg border divide-y',
              fullHeight
                ? 'max-h-[280px] lg:max-h-none lg:flex-1 lg:min-h-0'
                : 'max-h-[280px] lg:max-h-[420px]'
            )}
          >
          {result.moves.map((m, i) => {
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhite = i % 2 === 0;
            const notable = NOTABLE.has(m.classification);
            const isCurrent = ply === i + 1;
            return (
              <button
                key={i}
                data-ply={i + 1}
                onClick={() => setPlyAndSync(i + 1)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors',
                  isCurrent ? 'bg-primary-100 dark:bg-primary-900/40' : 'hover:bg-muted/60'
                )}
              >
                <span className="w-10 text-muted-foreground tabular-nums shrink-0">
                  {isWhite ? `${moveNumber}.` : `${moveNumber}…`}
                </span>
                <span className="w-14 font-medium font-mono shrink-0">{m.move.san}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center gap-1.5 flex-1 cursor-help"
                      style={{ color: getMoveClassificationColor(m.classification) }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: getMoveClassificationColor(m.classification),
                        }}
                      />
                      {CLASSIFICATION_LABEL[m.classification]}
                      {notable && m.centipawnLoss > 0 && (
                        <span className="text-muted-foreground">
                          (-{(m.centipawnLoss / 100).toFixed(1)})
                        </span>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[240px]">
                    {CLASSIFICATION_DESC[m.classification]}
                    {notable && m.centipawnLoss > 0 && (
                      <>
                        <br />
                        <span className="text-xs opacity-80">
                          You lost {(m.centipawnLoss / 100).toFixed(1)} pawns of evaluation.
                        </span>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
                <span className="w-12 text-right font-mono text-muted-foreground tabular-nums shrink-0">
                  {formatWhiteEval(m.evaluation)}
                </span>
              </button>
            );
          })}
        </div>

          <div className="flex items-center justify-between gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={startReview}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Re-run review
            </Button>
            {fullHeight && (
              <span className="text-xs text-muted-foreground hidden lg:inline">
                ← → moves · ↑ ↓ mistakes
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Compute the SAN of the engine's best move for the current ply, so we can
 * show it in the caption. Returns null if unknown or unparseable. Uses the
 * position BEFORE the current ply's played move.
 */
function bestMoveSan(analysis: GameAnalysis, ply: number): string | null {
  if (ply < 1 || ply > analysis.moves.length) return null;
  const move = analysis.moves[ply - 1];
  if (!move.bestMove) return null;
  const parsed = uciSquares(move.bestMove);
  if (!parsed) return null;
  // FEN BEFORE this ply's move: previous move's FEN, or the start position.
  const beforeFen = ply === 1 ? new Chess().fen() : analysis.moves[ply - 2].fen;
  try {
    const g = new Chess(beforeFen);
    const played = g.move({
      from: parsed.from,
      to: parsed.to,
      promotion: move.bestMove.length >= 5 ? (move.bestMove[4] as never) : undefined,
    });
    return played?.san ?? null;
  } catch {
    return null;
  }
}

/** Caption shown below the interactive board. Explains the current move. */
function MoveCaption({
  analysis,
  ply,
  bestMoveSan,
}: {
  analysis: GameAnalysis;
  ply: number;
  bestMoveSan: string | null;
}) {
  if (ply === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center">
        Starting position. Click Next or a move on the right to step through.
      </p>
    );
  }
  const m = analysis.moves[ply - 1];
  if (!m) return null;
  const isWhite = (ply - 1) % 2 === 0;
  const label = CLASSIFICATION_LABEL[m.classification];
  const color = getMoveClassificationColor(m.classification);
  const notable = NOTABLE.has(m.classification);

  return (
    <div className="text-sm text-center space-y-1">
      <div className="font-mono">
        <span className="text-muted-foreground">{isWhite ? 'White' : 'Black'} played</span>{' '}
        <span className="font-bold">{m.move.san}</span>{' '}
        <span
          className="inline-flex items-center gap-1.5 ml-1 font-medium"
          style={{ color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {label}
          {notable && m.centipawnLoss > 0 && (
            <span className="text-muted-foreground text-xs">
              (-{(m.centipawnLoss / 100).toFixed(1)})
            </span>
          )}
        </span>
      </div>
      {notable && bestMoveSan && (
        <p className="text-xs text-muted-foreground">
          Engine&apos;s move:{' '}
          <span className="font-mono font-medium text-green-600 dark:text-green-500">
            {bestMoveSan}
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Dependency-free SVG line chart of white-POV evaluation across the game.
 * Positive area (white better) shades green; negative area (black better)
 * shades gray. Click anywhere to jump to that ply.
 */
function EvalSparkline({
  evals,
  currentPly,
  onSelect,
}: {
  evals: number[];
  currentPly: number;
  onSelect: (ply: number) => void;
}) {
  const width = 320;
  const height = 60;
  const midY = height / 2;
  const scaleY = midY - 4;
  const CLAMP = 1000; // ±10 pawns (~mate) — clamp to keep the graph readable.

  const points = useMemo(() => {
    // Include the starting eval (0) as point 0 so ply-index maps 1:1 with x.
    const raw = [0, ...evals];
    return raw.map((e, i) => {
      const clamped = Math.max(-CLAMP, Math.min(CLAMP, e));
      const x = raw.length > 1 ? (i / (raw.length - 1)) * width : 0;
      const y = midY - (clamped / CLAMP) * scaleY;
      return { x, y, raw: e };
    });
  }, [evals, midY, scaleY]);

  const linePath = points
    .map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1))
    .join(' ');

  // Separate area paths: above midline (white winning) shaded green,
  // below midline (black winning) shaded gray. Clip each to its half.
  const areaAbove =
    `M ${points[0].x},${midY} ` +
    points.map((p) => `L ${p.x.toFixed(1)},${Math.min(p.y, midY).toFixed(1)}`).join(' ') +
    ` L ${points[points.length - 1].x},${midY} Z`;
  const areaBelow =
    `M ${points[0].x},${midY} ` +
    points.map((p) => `L ${p.x.toFixed(1)},${Math.max(p.y, midY).toFixed(1)}`).join(' ') +
    ` L ${points[points.length - 1].x},${midY} Z`;

  const currentX =
    points[Math.min(currentPly, points.length - 1)]?.x ?? 0;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const nearestIdx = Math.round((relX / width) * (points.length - 1));
    onSelect(Math.max(0, Math.min(evals.length, nearestIdx)));
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-2 space-y-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
        <span>Eval</span>
        <span>ply {currentPly}/{evals.length}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onClick={handleClick}
        className="w-full h-14 cursor-pointer select-none"
        role="img"
        aria-label="Evaluation graph across the game — click to jump"
      >
        {/* zero line */}
        <line
          x1="0"
          y1={midY}
          x2={width}
          y2={midY}
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeDasharray="3,3"
        />
        {/* fills */}
        <path d={areaAbove} fill="rgb(34, 197, 94)" fillOpacity="0.18" />
        <path d={areaBelow} fill="rgb(120, 120, 120)" fillOpacity="0.18" />
        {/* eval line */}
        <path
          d={linePath}
          fill="none"
          stroke="rgb(34, 197, 94)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* current-ply marker */}
        <line
          x1={currentX}
          y1="0"
          x2={currentX}
          y2={height}
          stroke="rgb(59, 130, 246)"
          strokeWidth="1.5"
        />
        <circle
          cx={currentX}
          cy={points[Math.min(currentPly, points.length - 1)]?.y ?? midY}
          r="3.5"
          fill="rgb(59, 130, 246)"
        />
      </svg>
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

function SummaryPill({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}12` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-medium">{label}</span>
      <span className="font-mono">{count}</span>
    </span>
  );
}
