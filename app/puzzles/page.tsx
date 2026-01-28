'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PuzzleBoard } from '@/components/chess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStore } from '@/store/user-store';
import { cn } from '@/lib/utils';
import {
  Flame,
  Trophy,
  Clock,
  Target,
  Zap,
  ChevronRight,
  Calendar,
  BarChart3,
  Star,
  RefreshCw,
  Play,
  Pause,
} from 'lucide-react';

// Sample puzzles data (in production, this would come from the database)
const samplePuzzles = [
  {
    id: '1',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',
    moves: ['h5f7'], // Scholar's mate threat
    rating: 800,
    themes: ['mateIn1', 'sacrifice'],
  },
  {
    id: '2',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['c4f7', 'e8f7', 'd1h5', 'g7g6', 'h5e5'],
    rating: 1000,
    themes: ['fork', 'discoveredAttack'],
  },
  {
    id: '3',
    fen: 'r2qkb1r/ppp2ppp/2np1n2/4p1B1/2B1P1b1/3P1N2/PPP2PPP/RN1QK2R w KQkq - 0 6',
    moves: ['c4f7', 'e8e7', 'g5f6', 'g7f6'],
    rating: 1200,
    themes: ['sacrifice', 'attack'],
  },
  {
    id: '4',
    fen: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    moves: ['g8f6', 'e1g1', 'f6e4', 'd2d3'],
    rating: 900,
    themes: ['development', 'opening'],
  },
  {
    id: '5',
    fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
    moves: ['e1e8'],
    rating: 600,
    themes: ['mateIn1', 'backRankMate'],
  },
  {
    id: '6',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    moves: ['f3g5', 'd7d5', 'e4d5', 'f6d5'],
    rating: 1100,
    themes: ['attack', 'pawnStructure'],
  },
];

// Daily puzzle (changes daily)
const getDailyPuzzle = () => {
  const today = new Date().toDateString();
  const index = today.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % samplePuzzles.length;
  return samplePuzzles[index];
};

export default function PuzzlesPage() {
  const { user, recordPuzzleSolved } = useUserStore();
  const [currentTab, setCurrentTab] = useState('daily');
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [dailyCompleted, setDailyCompleted] = useState(false);

  // Puzzle Rush state
  const [rushActive, setRushActive] = useState(false);
  const [rushTime, setRushTime] = useState(300); // 5 minutes
  const [rushScore, setRushScore] = useState(0);
  const [rushBestScore, setRushBestScore] = useState(0);

  // Timer for puzzle rush
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rushActive && rushTime > 0) {
      interval = setInterval(() => {
        setRushTime((t) => t - 1);
      }, 1000);
    } else if (rushTime === 0) {
      setRushActive(false);
      if (rushScore > rushBestScore) {
        setRushBestScore(rushScore);
      }
    }
    return () => clearInterval(interval);
  }, [rushActive, rushTime, rushScore, rushBestScore]);

  const dailyPuzzle = getDailyPuzzle();
  const currentPuzzle = samplePuzzles[currentPuzzleIndex];

  const handlePuzzleSolved = useCallback(() => {
    recordPuzzleSolved(true);
    if (currentTab === 'daily') {
      setDailyCompleted(true);
    } else if (currentTab === 'rush') {
      setRushScore((s) => s + 1);
      setCurrentPuzzleIndex((i) => (i + 1) % samplePuzzles.length);
    }
  }, [currentTab, recordPuzzleSolved]);

  const handlePuzzleFailed = useCallback(() => {
    recordPuzzleSolved(false);
    if (currentTab === 'rush') {
      // In rush mode, wrong answer ends the game
      setRushActive(false);
      if (rushScore > rushBestScore) {
        setRushBestScore(rushScore);
      }
    }
  }, [currentTab, recordPuzzleSolved, rushScore, rushBestScore]);

  const handleNextPuzzle = useCallback(() => {
    setCurrentPuzzleIndex((i) => (i + 1) % samplePuzzles.length);
  }, []);

  const startRush = () => {
    setRushActive(true);
    setRushTime(300);
    setRushScore(0);
    setCurrentPuzzleIndex(Math.floor(Math.random() * samplePuzzles.length));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const stats = user?.stats || {
    puzzlesSolved: 0,
    puzzleStreak: 0,
    bestPuzzleStreak: 0,
    puzzleSuccessRate: 0,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Main content */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Chess Puzzles</h1>
            <div className="flex items-center gap-2">
              {stats.puzzleStreak > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  {stats.puzzleStreak} streak
                </Badge>
              )}
            </div>
          </div>

          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="daily">
                <Calendar className="h-4 w-4 mr-2" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="practice">
                <Target className="h-4 w-4 mr-2" />
                Practice
              </TabsTrigger>
              <TabsTrigger value="rush">
                <Zap className="h-4 w-4 mr-2" />
                Rush
              </TabsTrigger>
            </TabsList>

            {/* Daily Puzzle */}
            <TabsContent value="daily" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary-600" />
                        Daily Puzzle
                      </CardTitle>
                      <CardDescription>
                        Solve today's puzzle to maintain your streak
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      Rating: {dailyPuzzle.rating}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {dailyCompleted ? (
                    <div className="text-center py-12 space-y-4">
                      <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
                      <h2 className="text-2xl font-bold">Daily Complete!</h2>
                      <p className="text-muted-foreground">
                        Come back tomorrow for a new puzzle
                      </p>
                      <Button variant="outline" onClick={() => setCurrentTab('practice')}>
                        Practice More Puzzles
                      </Button>
                    </div>
                  ) : (
                    <PuzzleBoard
                      fen={dailyPuzzle.fen}
                      moves={dailyPuzzle.moves}
                      rating={dailyPuzzle.rating}
                      themes={dailyPuzzle.themes}
                      onSolved={handlePuzzleSolved}
                      onFailed={handlePuzzleFailed}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Practice Puzzles */}
            <TabsContent value="practice" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary-600" />
                        Practice Puzzles
                      </CardTitle>
                      <CardDescription>
                        Improve your tactics with unlimited puzzles
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      Rating: {currentPuzzle.rating}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <PuzzleBoard
                    key={currentPuzzle.id}
                    fen={currentPuzzle.fen}
                    moves={currentPuzzle.moves}
                    rating={currentPuzzle.rating}
                    themes={currentPuzzle.themes}
                    onSolved={handlePuzzleSolved}
                    onFailed={handlePuzzleFailed}
                    onSkip={handleNextPuzzle}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Puzzle Rush */}
            <TabsContent value="rush" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        Puzzle Rush
                      </CardTitle>
                      <CardDescription>
                        Solve as many puzzles as possible in 5 minutes
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {rushActive && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'font-mono text-lg px-4 py-2',
                            rushTime < 30 && 'text-red-500 animate-pulse'
                          )}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(rushTime)}
                        </Badge>
                      )}
                      <Badge className="font-mono text-lg px-4 py-2">
                        Score: {rushScore}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!rushActive ? (
                    <div className="text-center py-12 space-y-6">
                      <Zap className="h-16 w-16 mx-auto text-yellow-500" />
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Puzzle Rush</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          You have 5 minutes to solve as many puzzles as
                          possible. One wrong move and the game is over!
                        </p>
                      </div>

                      {rushBestScore > 0 && (
                        <div className="flex items-center justify-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" />
                          <span className="text-lg">Best Score: {rushBestScore}</span>
                        </div>
                      )}

                      <Button size="lg" onClick={startRush}>
                        <Play className="h-5 w-5 mr-2" />
                        Start Rush
                      </Button>
                    </div>
                  ) : (
                    <PuzzleBoard
                      key={`rush-${currentPuzzleIndex}`}
                      fen={currentPuzzle.fen}
                      moves={currentPuzzle.moves}
                      rating={currentPuzzle.rating}
                      themes={currentPuzzle.themes}
                      onSolved={handlePuzzleSolved}
                      onFailed={handlePuzzleFailed}
                      showRating={false}
                      showHintButton={false}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar with stats */}
        <div className="space-y-4">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Your Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.puzzlesSolved}
                  </div>
                  <div className="text-xs text-muted-foreground">Puzzles Solved</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {stats.puzzleSuccessRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Current Streak
                  </span>
                  <span className="font-bold">{stats.puzzleStreak}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Best Streak
                  </span>
                  <span className="font-bold">{stats.bestPuzzleStreak}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Puzzle Rush Best Score */}
          {rushBestScore > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Rush Record
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-500">
                    {rushBestScore}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Puzzles in 5 minutes
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theme Categories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Puzzle Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  'Fork',
                  'Pin',
                  'Skewer',
                  'Mate in 1',
                  'Mate in 2',
                  'Sacrifice',
                  'Back Rank',
                  'Discovery',
                ].map((theme) => (
                  <Badge key={theme} variant="outline" className="cursor-pointer hover:bg-muted">
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary-600" />
                  Look for checks, captures, and threats first
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary-600" />
                  Take your time - accuracy is more important than speed
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 mt-0.5 text-primary-600" />
                  If you're stuck, look for undefended pieces
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
