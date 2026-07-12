'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/game-store';
import { saveGameResult } from '@/lib/games/client';
import { useUIStore } from '@/store/ui-store';
import { useUserStore } from '@/store/user-store';
import { ChessBoard, MoveHistory, GameControls, GameInfo, EvaluationBar, GameReview } from '@/components/chess';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Bot,
  User,
  RefreshCw,
  Download,
  Settings,
  BarChart3,
  Play,
  Pause,
  Lightbulb,
  X,
} from 'lucide-react';
import type { Square } from 'chess.js';
import { cn } from '@/lib/utils';
import {
  getComputerMove,
  setElo,
  initEngine,
  isEngineReady,
  analyzePosition,
  stopAnalysis,
} from '@/lib/stockfish';
import { getLocalBestMove } from '@/lib/local-engine';
import { parseUciMove, uciToSan } from '@/lib/chess';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Minimum time the computer "thinks" before moving, so its reply is easy to follow.
const COMPUTER_MIN_THINK_MS = 650;

/**
 * Wall-clock search budget for the computer's move, scaled by ELO. Using
 * `go movetime` instead of a fixed depth keeps reply latency predictable
 * (a depth-15 search can take many seconds on slow devices, which used to
 * trip the fallback race and freeze the UI in the synchronous JS engine).
 */
function computerMoveTime(elo: number): number {
  return Math.round(Math.max(300, Math.min(1400, 300 + (elo - 800) * 0.6)));
}

/**
 * Let the browser paint (e.g. the "Thinking…" indicator) before running a
 * long synchronous task on the main thread. Races a plain timeout against
 * requestAnimationFrame because rAF never fires in hidden/background tabs —
 * without the timeout the computer's move would stall until the tab refocuses.
 */
function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    requestAnimationFrame(() => setTimeout(finish, 0));
    setTimeout(finish, 60);
  });
}

// Difficulty presets
const difficultyPresets = [
  { name: 'Beginner', elo: 800, description: 'Just learning' },
  { name: 'Casual', elo: 1200, description: 'Knows the basics' },
  { name: 'Intermediate', elo: 1500, description: 'Club player' },
  { name: 'Advanced', elo: 1800, description: 'Tournament player' },
  { name: 'Expert', elo: 2000, description: 'Strong player' },
  { name: 'Master', elo: 2200, description: 'Master level' },
  { name: 'Grandmaster', elo: 2500, description: 'Top level' },
];

export default function PlayPage() {
  const {
    fen,
    turn,
    history,
    historyIndex,
    isGameOver,
    isCheckmate,
    isStalemate,
    result,
    mode,
    playerColor,
    computerElo,
    config,
    evaluation,
    openingName,
    openingEco,
    setMode,
    setPlayerColor,
    setComputerElo,
    setEvaluation,
    setBestMove,
    newGame,
    movePiece,
    getPgn,
  } = useGameStore();

  const {
    showEvaluation,
    autoAnalyze,
    showLegalMoves,
    toggleEvaluation,
    toggleLegalMoves,
    analysisDepth,
  } = useUIStore();
  const { recordGamePlayed, startSession } = useUserStore();

  const [engineReady, setEngineReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  // Hint arrow (best move for the player), shown on demand during a game.
  const [hintArrow, setHintArrow] = useState<[Square, Square] | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  // Lets the user close the game-over overlay to study the final position.
  const [gameOverDismissed, setGameOverDismissed] = useState(false);
  // One-time "how to move" coach tip for first-time players. Guest-safe: the
  // seen-flag lives in localStorage and any access is tolerated to fail.
  const [showCoach, setShowCoach] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem('chess-play-coached')) setShowCoach(true);
    } catch {
      /* private mode / storage disabled — just skip the tip */
    }
  }, []);
  const dismissCoach = useCallback(() => {
    setShowCoach(false);
    try {
      localStorage.setItem('chess-play-coached', '1');
    } catch {
      /* ignore */
    }
  }, []);
  // Guard so a finished game is persisted to history exactly once.
  const savedGameRef = useRef(false);
  // Track the FEN the computer last attempted to move from, so a failed engine
  // reply (illegal move / dead worker) can't loop the move-trigger effect.
  const computerLastFenRef = useRef<string | null>(null);

  const playerToMove = mode === 'vsComputer' && !isGameOver && turn === playerColor;

  // Board/navigation keyboard shortcuts (arrows, F flip, Ctrl+Z undo, …).
  // "N" opens the new-game dialog instead of silently resetting the game.
  // Suspended while a dialog is open — the review dialog has its own keyboard
  // navigation and must not drive the underlying board at the same time.
  useKeyboardShortcuts({
    onNewGame: () => setShowNewGameDialog(true),
    disabled: showReview || showNewGameDialog,
  });

  // Initialize engine and session. Default to playing the computer so the
  // opponent responds immediately (instead of landing in free/both-sides mode).
  useEffect(() => {
    startSession();
    if (mode === 'free') {
      setMode('vsComputer');
      newGame();
    }
    initEngine().then((ready) => {
      setEngineReady(ready);
      if (ready) {
        setElo(computerElo);
      }
    });
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Make the computer move when it's its turn. Not gated on engineReady: if
  // Stockfish hasn't loaded, makeComputerMove falls back to the local engine,
  // so the computer always replies. Guards against re-firing on the same FEN
  // (which would loop forever if the engine returned an illegal move).
  useEffect(() => {
    if (
      mode === 'vsComputer' &&
      !isGameOver &&
      // Never move while the user is browsing history — the engine would
      // reply from a PAST position and truncate the rest of the game.
      historyIndex === -1 &&
      turn !== playerColor &&
      !isThinking &&
      computerLastFenRef.current !== fen
    ) {
      computerLastFenRef.current = fen;
      makeComputerMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, playerColor, isGameOver, isThinking, fen, historyIndex]);

  // Reset the per-FEN guard whenever a new game starts so the computer can move
  // again from the fresh starting position.
  useEffect(() => {
    if (history.length === 0) computerLastFenRef.current = null;
  }, [history.length]);

  // Also clear the guard whenever it's the player's turn: after an undo the
  // player may replay the exact same move (same FEN), and a stale guard would
  // block the computer from ever replying to it.
  useEffect(() => {
    if (turn === playerColor) computerLastFenRef.current = null;
  }, [turn, playerColor, fen]);

  // Re-arm the trigger when the user returns from browsing history to the live
  // position, so a reply that was discarded mid-browse is re-requested.
  useEffect(() => {
    if (historyIndex === -1) computerLastFenRef.current = null;
  }, [historyIndex]);

  // Analyze position when autoAnalyze is enabled. Skips during the engine's
  // own turn so auto-analyze can't compete with the move search for the same
  // (serialized) engine slot.
  useEffect(() => {
    if (autoAnalyze && engineReady && !isThinking && turn === playerColor && !isGameOver) {
      analyzeCurrentPosition();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, autoAnalyze, engineReady, isThinking, turn, playerColor, isGameOver]);

  // Reset the save guard whenever a fresh game is in progress.
  useEffect(() => {
    if (!isGameOver) {
      savedGameRef.current = false;
      setGameOverDismissed(false);
    }
  }, [isGameOver]);

  // Record game result (stats) and persist the game to history — once.
  useEffect(() => {
    if (!isGameOver || mode !== 'vsComputer' || savedGameRef.current) return;
    savedGameRef.current = true;

    let gameResult: 'win' | 'loss' | 'draw' = 'draw';
    if (isCheckmate) {
      gameResult = turn === playerColor ? 'loss' : 'win';
    }
    recordGamePlayed(gameResult);

    // Only persist games that actually have moves.
    if (history.length > 0 && result && result !== '*') {
      void saveGameResult({
        pgn: getPgn(),
        result,
        playerColor,
        opponentType: 'computer',
        opponentElo: computerElo,
        openingName,
        openingEco,
      });
    }
  }, [
    isGameOver,
    isCheckmate,
    turn,
    playerColor,
    mode,
    recordGamePlayed,
    history.length,
    result,
    computerElo,
    openingName,
    openingEco,
    getPgn,
  ]);

  const makeComputerMove = async () => {
    setIsThinking(true);
    const started = Date.now();
    try {
      let uciMove: string | null = null;

      // Prefer Stockfish when it's loaded, but cap the wait so a stuck/blocked
      // engine can't freeze the game; otherwise use the built-in local engine.
      if (isEngineReady()) {
        // Interrupt any in-flight analysis (auto-analyze / hint): searches are
        // serialized through one engine slot, so a pending depth search would
        // otherwise delay the computer's reply past the fallback race — which
        // is exactly the stutter this used to cause.
        stopAnalysis();
        const budget = computerMoveTime(computerElo);
        uciMove = await Promise.race<string | null>([
          getComputerMove(fen, budget),
          // Generous cap: the movetime search should finish within its budget,
          // so this only catches a genuinely wedged worker.
          new Promise<null>((resolve) => setTimeout(() => resolve(null), budget + 3000)),
        ]);
      }
      if (!uciMove) {
        // The local engine is synchronous — give the browser one frame to
        // paint the "Thinking…" indicator before blocking the main thread.
        await yieldToPaint();
        uciMove = getLocalBestMove(fen, computerElo);
      }

      // Keep a minimum "thinking" pause so the move is easy to follow instead
      // of snapping instantly after the player moves.
      const elapsed = Date.now() - started;
      if (elapsed < COMPUTER_MIN_THINK_MS) {
        await new Promise((resolve) => setTimeout(resolve, COMPUTER_MIN_THINK_MS - elapsed));
      }

      // Discard the reply if the position changed while searching (the user
      // undid a move or is browsing history) — applying it would corrupt the
      // game. The history-return effect re-arms the trigger to search again.
      const stillCurrent = () => {
        const s = useGameStore.getState();
        return s.fen === fen && s.historyIndex === -1;
      };
      if (uciMove && stillCurrent()) {
        const { from, to, promotion } = parseUciMove(uciMove);
        movePiece(from, to, promotion, true);
      }
    } catch (error) {
      console.error('Error getting computer move:', error);
      // Last resort so the game never stalls.
      await yieldToPaint();
      const s = useGameStore.getState();
      if (s.fen === fen && s.historyIndex === -1) {
        const fallback = getLocalBestMove(fen, computerElo);
        if (fallback) {
          const { from, to, promotion } = parseUciMove(fallback);
          movePiece(from, to, promotion, true);
        }
      }
    } finally {
      setIsThinking(false);
    }
  };

  // Clear any shown hint whenever the position changes (a move was made).
  useEffect(() => {
    setHintArrow(null);
  }, [fen]);

  // Suggest the player's best move as an arrow. Prefers full-strength Stockfish
  // (the playing engine is ELO-limited), falling back to the local engine.
  //
  // Race-safe: captures the FEN at request time and discards the result if the
  // position has changed by the time the engine replies. Without this guard, a
  // hint requested at position X that resolves AFTER the player moves to Y
  // would paint a stale arrow on the new position.
  const getHint = async () => {
    if (!playerToMove || isThinking || hintLoading) return;
    const requestFen = fen;
    const isStale = () => useGameStore.getState().fen !== requestFen;

    setHintLoading(true);
    try {
      let uci: string | null = null;
      if (isEngineReady()) {
        // Free the serialized engine slot from any in-flight auto-analyze so
        // the hint search starts immediately instead of queueing.
        stopAnalysis();
        uci = await Promise.race<string | null>([
          analyzePosition(requestFen, 15, 1).then((r) => r.bestMove),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);
      }
      if (!uci) {
        // Synchronous search — let the spinner paint before blocking.
        await yieldToPaint();
        uci = getLocalBestMove(requestFen, 2200);
      }
      if (uci && !isStale()) {
        const { from, to } = parseUciMove(uci);
        setHintArrow([from as Square, to as Square]);
      }
    } catch (error) {
      console.error('Hint failed:', error);
      if (!isStale()) {
        await yieldToPaint();
        const fallback = getLocalBestMove(requestFen, 2200);
        if (fallback && !isStale()) {
          const { from, to } = parseUciMove(fallback);
          setHintArrow([from as Square, to as Square]);
        }
      }
    } finally {
      setHintLoading(false);
    }
  };

  const analyzeCurrentPosition = async () => {
    // Capture the analyzed position so a slow engine reply can't paint a
    // stale evaluation onto a newer position (the move already happened).
    const requestFen = fen;
    const isStale = () => useGameStore.getState().fen !== requestFen;
    try {
      const analysis = await analyzePosition(requestFen, analysisDepth, 1);
      if (isStale() || !analysis.bestMove) return;

      // UCI scores are from the side-to-move's perspective; the eval bar and
      // readout are White-POV. Normalize (also folds mate scores into cp).
      const sideToMove = requestFen.split(' ')[1];
      const cpSideToMove = analysis.mate != null
        ? (analysis.mate > 0 ? 100_000 - analysis.mate : -100_000 - analysis.mate)
        : analysis.evaluation;
      const cpWhite = sideToMove === 'w' ? cpSideToMove : -cpSideToMove;

      setEvaluation(cpWhite);
      setBestMove(analysis.bestMove);
      const evalText =
        analysis.mate != null
          ? `#${Math.abs(analysis.mate)}`
          : `${cpWhite > 0 ? '+' : ''}${(cpWhite / 100).toFixed(2)}`;
      setAnalysisResult(
        `Eval: ${evalText} | Best: ${uciToSan(requestFen, analysis.bestMove) ?? analysis.bestMove}`
      );
    } catch (error) {
      console.error('Error analyzing position:', error);
    }
  };

  const handleStartNewGame = (color: 'w' | 'b' | 'random') => {
    const finalColor = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;
    setPlayerColor(finalColor);
    setMode('vsComputer');
    setElo(computerElo);
    newGame();
    setShowNewGameDialog(false);
  };

  const handleExportPgn = () => {
    const pgn = getPgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${new Date().toISOString().split('T')[0]}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDifficultyChange = (elo: string) => {
    const newElo = parseInt(elo);
    setComputerElo(newElo);
    setElo(newElo);
  };

  const currentDifficulty =
    difficultyPresets.find((d) => d.elo === computerElo) ||
    difficultyPresets.find((d) => d.elo === 1500)!;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Main board area */}
        <div className="space-y-4 min-w-0">
          {/* Board header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">Play vs Computer</h1>
              {mode === 'vsComputer' && (
                <Badge variant="secondary">
                  <Bot className="h-3 w-3 mr-1" />
                  {currentDifficulty.name} ({computerElo} ELO)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPgn}>
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export PGN</span>
              </Button>
              <Button size="sm" onClick={() => setShowNewGameDialog(true)}>
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Game</span>
              </Button>
            </div>
          </div>

          {/* First-visit coach tip — how to make a move (dismiss = never again) */}
          {showCoach && mode === 'vsComputer' && (
            <div
              role="note"
              className="flex items-start gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm dark:border-primary-800 dark:bg-primary-950/40"
            >
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  New to chess? You&apos;re playing {playerColor === 'w' ? 'White' : 'Black'} — your
                  pieces are along the bottom.
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Drag a piece to move it, or tap it and then tap a highlighted square. Stuck? Press{' '}
                  <span className="font-medium text-foreground">Hint</span> for the best move.
                </p>
              </div>
              <button
                onClick={dismissCoach}
                aria-label="Dismiss tip"
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Board with evaluation bar */}
          <div className="flex gap-2 items-stretch min-w-0">
            {showEvaluation && (
              <EvaluationBar
                evaluation={evaluation || 0}
                orientation="vertical"
                className="self-stretch shrink-0"
              />
            )}
            <div className="relative flex-1 min-w-0">
              <ChessBoard
                boardWidth={560}
                customArrows={
                  hintArrow ? [[hintArrow[0], hintArrow[1], 'rgb(34, 197, 94)']] : []
                }
              />

              {/* Thinking indicator */}
              {isThinking && (
                <div className="absolute top-2 right-2 bg-background/90 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Thinking...</span>
                </div>
              )}

              {/* Game over overlay — dismissible so the final position can be
                  studied, and hidden while stepping back through the moves. */}
              {isGameOver && !gameOverDismissed && historyIndex === -1 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Card className="w-72 relative">
                    <button
                      onClick={() => setGameOverDismissed(true)}
                      className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Close and view the board"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <CardHeader className="text-center pb-3">
                      <CardTitle>
                        {result === '1-0' || result === '0-1'
                          ? mode === 'vsComputer'
                            ? (result === '1-0') === (playerColor === 'w')
                              ? 'You Won!'
                              : 'You Lost'
                            : result === '1-0'
                            ? 'White Wins!'
                            : 'Black Wins!'
                          : 'Draw!'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isCheckmate
                          ? 'by checkmate'
                          : isStalemate
                          ? 'by stalemate'
                          : 'Game drawn'}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 items-stretch">
                      <Button onClick={() => setShowNewGameDialog(true)}>
                        New Game
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setShowReview(true)}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={handleExportPgn}>
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Game controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/50 p-2 rounded-lg">
            <GameControls
              showExportImport
              onExport={handleExportPgn}
              onNewGame={() => setShowNewGameDialog(true)}
            />

            <div className="flex items-center gap-3">
              {/* Hint — suggest the best move for the player */}
              <Button
                variant="outline"
                size="sm"
                onClick={getHint}
                disabled={!playerToMove || isThinking || hintLoading}
                title={playerToMove ? 'Show the best move' : "Wait for your turn"}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {hintLoading ? 'Thinking…' : 'Hint'}
              </Button>

              {/* Game Review */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReview(true)}
                disabled={history.length === 0}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Game Review
              </Button>

              {/* Analysis toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Analysis</span>
                <Switch
                  checked={showAnalysis}
                  onCheckedChange={setShowAnalysis}
                  aria-label="Toggle live analysis"
                />
              </div>
            </div>
          </div>

          {/* Analysis result */}
          {showAnalysis && analysisResult && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{analysisResult}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 min-w-0">
          {/* Game Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Game Info</CardTitle>
            </CardHeader>
            <CardContent>
              <GameInfo
                playerWhite={playerColor === 'w' ? 'You' : `Stockfish (${computerElo})`}
                playerBlack={playerColor === 'b' ? 'You' : `Stockfish (${computerElo})`}
              />
            </CardContent>
          </Card>

          {/* Move History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <MoveHistory maxHeight="250px" />
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Computer Difficulty
                </label>
                <Select
                  value={computerElo.toString()}
                  onValueChange={handleDifficultyChange}
                >
                  <SelectTrigger aria-label="Computer difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficultyPresets.map((preset) => (
                      <SelectItem key={preset.elo} value={preset.elo.toString()}>
                        <div className="flex items-center justify-between gap-4">
                          <span>{preset.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {preset.elo} ELO
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentDifficulty.description}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Show Evaluation</span>
                <Switch
                  checked={showEvaluation}
                  onCheckedChange={toggleEvaluation}
                  aria-label="Show evaluation bar"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Show Legal Moves</span>
                <Switch
                  checked={showLegalMoves}
                  onCheckedChange={toggleLegalMoves}
                  aria-label="Show legal moves"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Review Dialog — near-fullscreen on large displays so the board
          and move list get real estate; small screens scroll vertically. */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="flex flex-col w-[96vw] max-w-[1280px] h-[94vh] max-h-[94vh] sm:h-[92vh] sm:max-h-[92vh] overflow-hidden gap-3">
          <DialogHeader className="shrink-0">
            <DialogTitle>Game Review</DialogTitle>
            <DialogDescription>
              Stockfish accuracy and a move-by-move breakdown. Click a move or use the
              arrow keys to step through the game.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
            {/* No onSelectMove coupling: the review has its own board, and
                driving the underlying live game to historical positions from
                here risks the engine replying out of the past. */}
            <GameReview moves={history} fullHeight />
          </div>
        </DialogContent>
      </Dialog>

      {/* New Game Dialog */}
      <Dialog open={showNewGameDialog} onOpenChange={setShowNewGameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Game</DialogTitle>
            <DialogDescription>
              Choose your color and difficulty to start a new game against the
              computer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-3 block">
                Difficulty
              </label>
              <div className="grid grid-cols-2 gap-2">
                {difficultyPresets.map((preset) => (
                  <Button
                    key={preset.elo}
                    variant={computerElo === preset.elo ? 'default' : 'outline'}
                    onClick={() => handleDifficultyChange(preset.elo.toString())}
                    className="justify-start"
                  >
                    <div className="text-left">
                      <div>{preset.name}</div>
                      <div className="text-xs opacity-70">{preset.elo} ELO</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Play as</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleStartNewGame('w')}
                  className="flex-col h-auto py-4"
                >
                  <div className="h-8 w-8 rounded-full bg-white border-2 border-gray-300 mb-2" />
                  <span>White</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStartNewGame('random')}
                  className="flex-col h-auto py-4"
                >
                  <div className="flex mb-2">
                    <div className="h-4 w-4 rounded-full bg-white border border-gray-300" />
                    <div className="h-4 w-4 rounded-full bg-gray-800 -ml-1" />
                  </div>
                  <span>Random</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStartNewGame('b')}
                  className="flex-col h-auto py-4"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-800 mb-2" />
                  <span>Black</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
