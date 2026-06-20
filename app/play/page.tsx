'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getComputerMove, setElo, initEngine, isEngineReady, analyzePosition } from '@/lib/stockfish';
import { getLocalBestMove } from '@/lib/local-engine';
import { parseUciMove } from '@/lib/chess';

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
    isGameOver,
    isCheckmate,
    result,
    mode,
    playerColor,
    computerElo,
    config,
    evaluation,
    setMode,
    setPlayerColor,
    setComputerElo,
    setEvaluation,
    setBestMove,
    newGame,
    movePiece,
    goToMove,
    getPgn,
  } = useGameStore();

  const { showEvaluation, autoAnalyze } = useUIStore();
  const { recordGamePlayed, startSession } = useUserStore();

  const [engineReady, setEngineReady] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showNewGameDialog, setShowNewGameDialog] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

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
  // so the computer always replies.
  useEffect(() => {
    if (mode === 'vsComputer' && !isGameOver && turn !== playerColor && !isThinking) {
      makeComputerMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, playerColor, isGameOver, isThinking, fen]);

  // Analyze position when autoAnalyze is enabled
  useEffect(() => {
    if (autoAnalyze && engineReady && !isThinking) {
      analyzeCurrentPosition();
    }
  }, [fen, autoAnalyze, engineReady]);

  // Record game result
  useEffect(() => {
    if (isGameOver && mode === 'vsComputer') {
      let gameResult: 'win' | 'loss' | 'draw' = 'draw';
      if (isCheckmate) {
        gameResult = turn === playerColor ? 'loss' : 'win';
      }
      recordGamePlayed(gameResult);
    }
  }, [isGameOver, isCheckmate, turn, playerColor, mode, recordGamePlayed]);

  const makeComputerMove = async () => {
    setIsThinking(true);
    try {
      let uciMove: string | null = null;

      // Prefer Stockfish when it's loaded, but cap the wait so a stuck/blocked
      // engine can't freeze the game; otherwise use the built-in local engine.
      if (isEngineReady()) {
        uciMove = await Promise.race<string | null>([
          getComputerMove(fen),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
        ]);
      }
      if (!uciMove) {
        uciMove = getLocalBestMove(fen, computerElo);
      }

      if (uciMove) {
        const { from, to, promotion } = parseUciMove(uciMove);
        movePiece(from, to, promotion, true);
      }
    } catch (error) {
      console.error('Error getting computer move:', error);
      // Last resort so the game never stalls.
      const fallback = getLocalBestMove(fen, computerElo);
      if (fallback) {
        const { from, to, promotion } = parseUciMove(fallback);
        movePiece(from, to, promotion, true);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const analyzeCurrentPosition = async () => {
    try {
      const analysis = await analyzePosition(fen, 15, 1);
      setEvaluation(analysis.evaluation);
      setBestMove(analysis.bestMove);
      setAnalysisResult(
        `Eval: ${analysis.evaluation > 0 ? '+' : ''}${(analysis.evaluation / 100).toFixed(2)} | Best: ${analysis.bestMove}`
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
        <div className="space-y-4">
          {/* Board header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Play vs Computer</h1>
              {mode === 'vsComputer' && (
                <Badge variant="secondary">
                  <Bot className="h-3 w-3 mr-1" />
                  {currentDifficulty.name} ({computerElo} ELO)
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPgn}>
                <Download className="h-4 w-4 mr-2" />
                Export PGN
              </Button>
              <Button size="sm" onClick={() => setShowNewGameDialog(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                New Game
              </Button>
            </div>
          </div>

          {/* Board with evaluation bar */}
          <div className="flex gap-2">
            {showEvaluation && (
              <EvaluationBar
                evaluation={evaluation || 0}
                orientation="vertical"
                className="h-[560px]"
              />
            )}
            <div className="relative">
              <ChessBoard boardWidth={560} />

              {/* Thinking indicator */}
              {isThinking && (
                <div className="absolute top-2 right-2 bg-background/90 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                  <div className="h-2 w-2 bg-primary-600 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Thinking...</span>
                </div>
              )}

              {/* Game over overlay */}
              {isGameOver && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Card className="w-72">
                    <CardHeader className="text-center">
                      <CardTitle>
                        {result === '1-0'
                          ? 'White Wins!'
                          : result === '0-1'
                          ? 'Black Wins!'
                          : 'Draw!'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-2 justify-center">
                      <Button onClick={() => setShowNewGameDialog(true)}>
                        New Game
                      </Button>
                      <Button variant="outline" onClick={handleExportPgn}>
                        Export
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Game controls */}
          <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
            <GameControls showExportImport onExport={handleExportPgn} />

            <div className="flex items-center gap-3">
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
                <Switch checked={showAnalysis} onCheckedChange={setShowAnalysis} />
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
        <div className="space-y-4">
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
                  <SelectTrigger>
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
                  onCheckedChange={() => useUIStore.getState().toggleEvaluation()}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Show Legal Moves</span>
                <Switch
                  checked={useUIStore.getState().showLegalMoves}
                  onCheckedChange={() => useUIStore.getState().toggleLegalMoves()}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Review Dialog */}
      <Dialog open={showReview} onOpenChange={setShowReview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Game Review</DialogTitle>
            <DialogDescription>
              Stockfish accuracy and a move-by-move breakdown. Click a move to jump to it.
            </DialogDescription>
          </DialogHeader>
          <GameReview moves={history} onSelectMove={(index) => goToMove(index)} />
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
                {difficultyPresets.slice(0, 4).map((preset) => (
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
