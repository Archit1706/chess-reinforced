'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, type Square } from 'chess.js';
import {
  Sparkles,
  Wand2,
  RotateCcw,
  FlipVertical,
  Undo2,
  Trash2,
  Clipboard,
  ClipboardCheck,
  Play,
  Lightbulb,
  Loader2,
  AlertTriangle,
  Pencil,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import {
  initEngine,
  isEngineReady,
  analyzePosition,
  stopAnalysis,
  setLimitStrength,
} from '@/lib/stockfish';
import { getLocalBestMove } from '@/lib/local-engine';
import { parseUciMove, uciToSan, formatEvaluation, buildPv } from '@/lib/chess';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const BOARD_STYLE = {
  customDarkSquareStyle: { backgroundColor: '#b58863' },
  customLightSquareStyle: { backgroundColor: '#f0d9b5' },
} as const;

// react-chessboard piece codes ("wP") <-> FEN chars ("P").
const RC_TO_CHAR: Record<string, string> = {
  wK: 'K', wQ: 'Q', wR: 'R', wB: 'B', wN: 'N', wP: 'P',
  bK: 'k', bQ: 'q', bR: 'r', bB: 'b', bN: 'n', bP: 'p',
};
const CHAR_TO_RC: Record<string, string> = Object.fromEntries(
  Object.entries(RC_TO_CHAR).map(([rc, ch]) => [ch, rc])
);

type BoardObj = Record<string, string>;
const FILES = 'abcdefgh';

function boardToFen(pos: BoardObj, side: 'w' | 'b'): string {
  const ranks: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let row = '';
    let empty = 0;
    for (const f of FILES) {
      const piece = pos[`${f}${r}`];
      if (piece && RC_TO_CHAR[piece]) {
        if (empty) { row += empty; empty = 0; }
        row += RC_TO_CHAR[piece];
      } else {
        empty++;
      }
    }
    if (empty) row += empty;
    ranks.push(row);
  }
  return `${ranks.join('/')} ${side} - - 0 1`;
}

function fenToBoard(fen: string): BoardObj {
  const board = fen.split(' ')[0] ?? '';
  const pos: BoardObj = {};
  board.split('/').forEach((row, i) => {
    const rank = 8 - i;
    let file = 0;
    for (const ch of row) {
      if (ch >= '1' && ch <= '8') {
        file += parseInt(ch, 10);
      } else if (CHAR_TO_RC[ch]) {
        pos[`${FILES[file]}${rank}`] = CHAR_TO_RC[ch];
        file++;
      }
    }
  });
  return pos;
}

/** Load a FEN into a fresh Chess, returning it or a friendly error. */
function tryLoad(fen: string): { game: Chess } | { error: string } {
  const game = new Chess();
  try {
    game.load(fen);
    return { game };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Invalid position';
    // Translate the most common chess.js complaints into plain language.
    if (/king/i.test(msg)) return { error: 'Each side needs exactly one king.' };
    if (/check/i.test(msg))
      return { error: 'The side that is NOT to move cannot already be in check.' };
    return { error: `That position isn't legal (${msg.replace(/^Invalid FEN:\s*/i, '')}).` };
  }
}

const PALETTE: { code: string; glyph: string }[] = [
  { code: 'wK', glyph: '♔' }, { code: 'wQ', glyph: '♕' }, { code: 'wR', glyph: '♖' },
  { code: 'wB', glyph: '♗' }, { code: 'wN', glyph: '♘' }, { code: 'wP', glyph: '♙' },
  { code: 'bK', glyph: '♚' }, { code: 'bQ', glyph: '♛' }, { code: 'bR', glyph: '♜' },
  { code: 'bB', glyph: '♝' }, { code: 'bN', glyph: '♞' }, { code: 'bP', glyph: '♟' },
];

type BestMove = {
  uci: string;
  san: string;
  from: string;
  to: string;
  evalText: string | null;
  pv: string;
  pvUci: string[];
};

export default function AnalysisPage() {
  // The live position (play/analyse mode) lives in a chess.js instance.
  const gameRef = useRef(new Chess(START_FEN));
  const [fen, setFen] = useState(START_FEN);
  const [setupFen, setSetupFen] = useState(START_FEN); // the position to "reset" to
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const playingAs: 'w' | 'b' = orientation === 'white' ? 'w' : 'b';

  const [editing, setEditing] = useState(false);
  const [boardObj, setBoardObj] = useState<BoardObj>(() => fenToBoard(START_FEN));
  const [editSide, setEditSide] = useState<'w' | 'b'>('w');
  const [selected, setSelected] = useState<string | null>(null); // palette code or 'trash'

  const [best, setBest] = useState<BestMove | null>(null);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fenInput, setFenInput] = useState('');
  const [copied, setCopied] = useState(false);

  const [boardRef, containerWidth] = useContainerWidth<HTMLDivElement>();
  const boardWidth = Math.min(560, containerWidth > 0 ? containerWidth : 560);

  // Full-strength engine for genuine best moves (the play page ELO-limits it).
  useEffect(() => {
    initEngine().then((ready) => {
      if (ready) setLimitStrength(false);
    });
  }, []);

  const turn = fen.split(' ')[1] === 'b' ? 'b' : 'w';
  const game = gameRef.current;
  const gameOver = !editing && game.isGameOver();
  const inCheck = !editing && game.inCheck();

  // ---- Play / analyse mode ----
  const clearBest = useCallback(() => setBest(null), []);

  const onPieceDrop = useCallback((from: string, to: string, piece: string) => {
    if (editing) {
      // Free placement — move the piece with no legality checks.
      setBoardObj((prev) => {
        const next = { ...prev };
        delete next[from];
        next[to] = piece;
        return next;
      });
      return true;
    }
    try {
      const move = game.move({ from, to, promotion: 'q' });
      if (!move) return false;
      setFen(game.fen());
      setBest(null);
      return true;
    } catch {
      return false;
    }
  }, [editing, game]);

  const onSquareClick = useCallback((square: string) => {
    if (!editing) return;
    setBoardObj((prev) => {
      const next = { ...prev };
      if (selected === 'trash') delete next[square];
      else if (selected) next[square] = selected;
      else return prev;
      return next;
    });
  }, [editing, selected]);

  const undo = useCallback(() => {
    game.undo();
    setFen(game.fen());
    setBest(null);
  }, [game]);

  const reset = useCallback(() => {
    const res = tryLoad(setupFen);
    if ('game' in res) {
      gameRef.current = res.game;
      setFen(res.game.fen());
      setBest(null);
      setError(null);
    }
  }, [setupFen]);

  const flip = useCallback(() => setOrientation((o) => (o === 'white' ? 'black' : 'white')), []);

  // ---- Edit mode ----
  const enterEdit = useCallback(() => {
    setBoardObj(fenToBoard(gameRef.current.fen()));
    setEditSide(gameRef.current.turn());
    setSelected(null);
    setBest(null);
    setError(null);
    setEditing(true);
  }, []);

  const applyEdit = useCallback((): boolean => {
    const candidate = boardToFen(boardObj, editSide);
    const res = tryLoad(candidate);
    if ('error' in res) {
      setError(res.error);
      return false;
    }
    gameRef.current = res.game;
    const nf = res.game.fen();
    setFen(nf);
    setSetupFen(nf);
    setEditing(false);
    setError(null);
    setBest(null);
    return true;
  }, [boardObj, editSide]);

  const loadPreset = useCallback((which: 'start' | 'empty') => {
    setBoardObj(which === 'start' ? fenToBoard(START_FEN) : {});
    setEditSide('w');
    setError(null);
  }, []);

  const loadFenInput = useCallback(() => {
    const trimmed = fenInput.trim();
    if (!trimmed) return;
    const res = tryLoad(trimmed);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    gameRef.current = res.game;
    const nf = res.game.fen();
    setFen(nf);
    setSetupFen(nf);
    setBoardObj(fenToBoard(nf));
    setEditSide(res.game.turn());
    setEditing(false);
    setError(null);
    setBest(null);
    setFenInput('');
  }, [fenInput]);

  const copyFen = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(gameRef.current.fen());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }, []);

  // ---- Best move ----
  const findBestMove = useCallback(async () => {
    if (editing) {
      if (!applyEdit()) return;
    }
    const current = gameRef.current;
    if (current.isGameOver()) {
      setError('This position is already over — no move to suggest.');
      return;
    }
    const requestFen = current.fen();
    const stale = () => gameRef.current.fen() !== requestFen;
    setThinking(true);
    setBest(null);
    setError(null);
    try {
      let uci: string | null = null;
      let evalCp: number | null = null;
      let pvUci: string[] = [];
      if (isEngineReady()) {
        stopAnalysis();
        const res = await Promise.race<Awaited<ReturnType<typeof analyzePosition>> | null>([
          analyzePosition(requestFen, 16, 1),
          new Promise<null>((r) => setTimeout(() => r(null), 3500)),
        ]);
        if (res) {
          uci = res.bestMove;
          evalCp = res.evaluation;
          pvUci = res.pv || [];
        }
      }
      if (!uci) {
        await new Promise((r) => setTimeout(r, 20)); // let the spinner paint
        uci = getLocalBestMove(requestFen, 2600);
      }
      if (uci && !stale()) {
        const { from, to } = parseUciMove(uci);
        const pv = buildPv(requestFen, pvUci.length ? pvUci : [uci]);
        setBest({
          uci,
          from,
          to,
          san: uciToSan(requestFen, uci) || uci,
          evalText: evalCp != null ? formatEvaluation(evalCp) : null,
          pv: pv.uci.length > 1 ? pv.text : '',
          pvUci: pv.uci,
        });
      } else if (!uci) {
        setError('Could not find a move for this position.');
      }
    } catch {
      const fallback = getLocalBestMove(requestFen, 2600);
      if (fallback && !stale()) {
        const { from, to } = parseUciMove(fallback);
        setBest({
          uci: fallback,
          from,
          to,
          san: uciToSan(requestFen, fallback) || fallback,
          evalText: null,
          pv: '',
          pvUci: [fallback],
        });
      }
    } finally {
      setThinking(false);
    }
  }, [editing, applyEdit]);

  const playBest = useCallback(() => {
    if (!best) return;
    try {
      game.move({ from: best.from, to: best.to, promotion: (best.uci[4] as any) || 'q' });
      setFen(game.fen());
      setBest(null);
    } catch {
      /* shouldn't happen — the move came from this position */
    }
  }, [best, game]);

  // Play out the whole principal variation, move by move.
  const playLine = useCallback(() => {
    if (!best || best.pvUci.length === 0) return;
    for (const uci of best.pvUci) {
      try {
        const m = game.move({
          from: uci.slice(0, 2),
          to: uci.slice(2, 4),
          promotion: (uci[4] as any) || undefined,
        });
        if (!m) break;
      } catch {
        break;
      }
    }
    setFen(game.fen());
    setBest(null);
  }, [best, game]);

  const customArrows = useMemo(
    () => (best ? [[best.from, best.to, 'rgb(34,197,94)'] as [string, string, string]] : []),
    [best]
  );

  const turnLabel = turn === 'w' ? 'White' : 'Black';
  const yourTurn = !editing && !gameOver && turn === playingAs;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <Wand2 className="h-7 w-7 text-primary-600" />
          Analysis Board
        </h1>
        <p className="mt-1 text-muted-foreground">
          Set up any position, choose your side, and ask the engine for the best move — then make
          the replies yourself. Your own pocket coach.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Board column */}
        <div className="min-w-0">
          <div ref={boardRef} className="mx-auto w-full min-w-0 max-w-[560px]">
            <Chessboard
              position={editing ? (boardObj as any) : fen}
              boardWidth={boardWidth}
              boardOrientation={orientation}
              arePiecesDraggable
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              customArrows={customArrows as any}
              animationDuration={editing ? 0 : 200}
              {...BOARD_STYLE}
            />
          </div>

          {/* Status line under the board */}
          <div className="mx-auto mt-3 flex max-w-[560px] items-center justify-center">
            {editing ? (
              <span className="text-sm text-muted-foreground">
                Editing position — tap a piece below, then tap squares to place it. Drag to move.
              </span>
            ) : gameOver ? (
              <span className="rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground">
                {game.isCheckmate() ? 'Checkmate' : game.isStalemate() ? 'Stalemate' : 'Game over'}
              </span>
            ) : (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
                  yourTurn
                    ? 'border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-500'
                    : 'text-muted-foreground'
                )}
              >
                {turnLabel} to move
                {inCheck && ' · check'}
                {yourTurn && ' · your turn'}
              </span>
            )}
          </div>
        </div>

        {/* Controls column */}
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {editing ? (
            <Card>
              <CardContent className="space-y-4 pt-6">
                {/* Piece palette */}
                <div>
                  <div className="mb-2 text-sm font-medium">Pieces</div>
                  <div className="grid grid-cols-6 gap-1">
                    {PALETTE.map((p) => (
                      <button
                        key={p.code}
                        type="button"
                        onClick={() => setSelected(p.code)}
                        aria-label={`Place ${p.code}`}
                        aria-pressed={selected === p.code}
                        className={cn(
                          'flex h-10 items-center justify-center rounded-md border text-2xl leading-none',
                          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected === p.code && 'ring-2 ring-primary-600'
                        )}
                      >
                        {p.glyph}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected('trash')}
                    aria-pressed={selected === 'trash'}
                    className={cn(
                      'mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border py-1.5 text-sm',
                      'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected === 'trash' && 'ring-2 ring-red-500'
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eraser
                  </button>
                </div>

                {/* Side to move */}
                <div>
                  <div className="mb-2 text-sm font-medium">Side to move</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['w', 'b'] as const).map((s) => (
                      <Button
                        key={s}
                        variant={editSide === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setEditSide(s)}
                      >
                        {s === 'w' ? 'White' : 'Black'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => loadPreset('start')}>
                    Start position
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => loadPreset('empty')}>
                    Empty board
                  </Button>
                </div>

                <Button className="w-full" onClick={applyEdit}>
                  <Check className="mr-2 h-4 w-4" />
                  Done — use this position
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Best move */}
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={findBestMove}
                    disabled={thinking || gameOver}
                  >
                    {thinking ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Thinking…
                      </>
                    ) : (
                      <>
                        <Lightbulb className="mr-2 h-5 w-5" />
                        Best move for {turnLabel}
                      </>
                    )}
                  </Button>

                  {best && (
                    <div className="space-y-3 rounded-lg bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">Engine suggests</div>
                          <div className="font-mono text-2xl font-bold">{best.san}</div>
                        </div>
                        {best.evalText && (
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Eval</div>
                            <div className="font-mono text-lg font-semibold tabular-nums">
                              {best.evalText}
                            </div>
                          </div>
                        )}
                      </div>

                      {best.pv && (
                        <div>
                          <div className="mb-0.5 text-xs text-muted-foreground">
                            Main line (engine&apos;s expected continuation)
                          </div>
                          <p className="break-words font-mono text-sm leading-relaxed">{best.pv}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" onClick={playBest}>
                          <Play className="mr-1.5 h-4 w-4" />
                          Play move
                        </Button>
                        {best.pvUci.length > 1 && (
                          <Button variant="ghost" size="sm" className="flex-1" onClick={playLine}>
                            Play whole line
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Suggests the best move for whoever is to move. Make the other side&apos;s replies
                    yourself by dragging pieces.
                  </p>
                </CardContent>
              </Card>

              {/* You are playing */}
              <Card>
                <CardContent className="space-y-3 pt-6">
                  <div className="text-sm font-medium">You are playing</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['white', 'black'] as const).map((c) => (
                      <Button
                        key={c}
                        variant={orientation === c ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setOrientation(c)}
                        className="capitalize"
                      >
                        {c}
                      </Button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={undo}>
                      <Undo2 className="mr-1.5 h-4 w-4" />
                      Undo
                    </Button>
                    <Button variant="outline" size="sm" onClick={reset}>
                      <RotateCcw className="mr-1.5 h-4 w-4" />
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={flip}>
                      <FlipVertical className="mr-1.5 h-4 w-4" />
                      Flip
                    </Button>
                  </div>

                  <Button variant="outline" size="sm" className="w-full" onClick={enterEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit position
                  </Button>
                </CardContent>
              </Card>

              {/* FEN */}
              <Card>
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Position (FEN)</span>
                    <Button variant="ghost" size="sm" onClick={copyFen}>
                      {copied ? (
                        <>
                          <ClipboardCheck className="mr-1.5 h-4 w-4 text-green-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Clipboard className="mr-1.5 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={fenInput}
                    onChange={(e) => setFenInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadFenInput()}
                    placeholder="Paste a FEN to load…"
                    className="w-full rounded-md border bg-background px-2 py-1.5 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Load a position from FEN"
                  />
                  <Button variant="outline" size="sm" className="w-full" onClick={loadFenInput}>
                    Load FEN
                  </Button>
                  <p className="break-all font-mono text-[11px] text-muted-foreground">{fen}</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
