'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleBoard } from '@/components/chess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserStore } from '@/store/user-store';
import { cn } from '@/lib/utils';
import {
  fetchDailyPuzzle,
  fetchRandomPuzzle,
  fetchThemes,
  fetchReviewPuzzles,
  recordPuzzleAttempt,
} from '@/lib/puzzles/client';
import { formatTheme } from '@/lib/puzzles/lichess';
import type { NormalizedPuzzle } from '@/lib/puzzles/types';
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
  Loader2,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

// Rating bands so practice puzzles roughly track the user's level.
const PRACTICE_BAND = 250;

export default function PuzzlesPage() {
  const { user, recordPuzzleSolved, startSession } = useUserStore();
  const [currentTab, setCurrentTab] = useState('daily');

  // Puzzle data (fetched from /api/puzzles, with client fallback).
  const [dailyPuzzle, setDailyPuzzle] = useState<NormalizedPuzzle | null>(null);
  const [practicePuzzle, setPracticePuzzle] = useState<NormalizedPuzzle | null>(null);
  const [rushPuzzle, setRushPuzzle] = useState<NormalizedPuzzle | null>(null);
  const [loadingPractice, setLoadingPractice] = useState(false);
  const [dailyCompleted, setDailyCompleted] = useState(false);

  // Theme filter for practice and the available theme list.
  const [practiceTheme, setPracticeTheme] = useState<string | null>(null);
  const [themes, setThemes] = useState<{ theme: string; count: number }[]>([]);

  // Spaced-repetition review queue.
  const [reviewQueue, setReviewQueue] = useState<NormalizedPuzzle[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewDue, setReviewDue] = useState(0);
  const [loadingReview, setLoadingReview] = useState(false);

  // Puzzle Rush state.
  const [rushActive, setRushActive] = useState(false);
  const [rushTime, setRushTime] = useState(300);
  const [rushScore, setRushScore] = useState(0);
  const [rushBestScore, setRushBestScore] = useState(0);

  // Per-puzzle timing for attempt logging.
  const puzzleStartRef = useRef<number>(Date.now());
  // Avoid showing the same puzzle twice in a row within a session.
  const seenRef = useRef<Set<string>>(new Set());

  const ratingBand = useCallback((): { minRating?: number; maxRating?: number } => {
    const elo = user?.stats.estimatedElo;
    if (!elo) return {};
    return { minRating: elo - PRACTICE_BAND, maxRating: elo + PRACTICE_BAND };
  }, [user?.stats.estimatedElo]);

  const loadPractice = useCallback(
    async (theme: string | null) => {
      setLoadingPractice(true);
      try {
        const puzzle = await fetchRandomPuzzle({
          ...ratingBand(),
          theme: theme ?? undefined,
          exclude: Array.from(seenRef.current),
        });
        seenRef.current.add(puzzle.id);
        puzzleStartRef.current = Date.now();
        setPracticePuzzle(puzzle);
      } finally {
        setLoadingPractice(false);
      }
    },
    [ratingBand]
  );

  const loadReviews = useCallback(async () => {
    setLoadingReview(true);
    try {
      const queue = await fetchReviewPuzzles();
      setReviewQueue(queue.puzzles);
      setReviewIndex(0);
      setReviewDue(queue.due);
    } finally {
      setLoadingReview(false);
    }
  }, []);

  // Initial load: session, daily puzzle, theme list, first practice puzzle, reviews.
  useEffect(() => {
    startSession();
    fetchDailyPuzzle().then(setDailyPuzzle);
    fetchThemes().then(setThemes);
    loadPractice(null);
    loadReviews();
    // Intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Puzzle Rush timer.
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (rushActive && rushTime > 0) {
      interval = setInterval(() => setRushTime((t) => t - 1), 1000);
    } else if (rushTime === 0 && rushActive) {
      setRushActive(false);
      setRushBestScore((best) => Math.max(best, rushScore));
    }
    return () => clearInterval(interval);
  }, [rushActive, rushTime, rushScore]);

  const logAttempt = useCallback(
    (puzzle: NormalizedPuzzle | null, solved: boolean) => {
      if (!puzzle) return;
      const timeSpent = Math.round((Date.now() - puzzleStartRef.current) / 1000);
      recordPuzzleSolved(solved); // client-side stats/streak
      void recordPuzzleAttempt({ puzzleId: puzzle.id, solved, timeSpent }); // server log
    },
    [recordPuzzleSolved]
  );

  // === Daily ===
  const handleDailySolved = useCallback(() => {
    logAttempt(dailyPuzzle, true);
    setDailyCompleted(true);
  }, [dailyPuzzle, logAttempt]);

  const handleDailyFailed = useCallback(() => {
    logAttempt(dailyPuzzle, false);
  }, [dailyPuzzle, logAttempt]);

  // === Practice ===
  const handlePracticeSolved = useCallback(() => {
    logAttempt(practicePuzzle, true);
  }, [practicePuzzle, logAttempt]);

  const handlePracticeFailed = useCallback(() => {
    logAttempt(practicePuzzle, false);
  }, [practicePuzzle, logAttempt]);

  const handleNextPractice = useCallback(() => {
    loadPractice(practiceTheme);
  }, [loadPractice, practiceTheme]);

  const selectTheme = useCallback(
    (theme: string | null) => {
      setPracticeTheme(theme);
      setCurrentTab('practice');
      loadPractice(theme);
    },
    [loadPractice]
  );

  // === Rush ===
  const loadRush = useCallback(async () => {
    const puzzle = await fetchRandomPuzzle({ exclude: Array.from(seenRef.current) });
    seenRef.current.add(puzzle.id);
    puzzleStartRef.current = Date.now();
    setRushPuzzle(puzzle);
  }, []);

  const startRush = useCallback(async () => {
    seenRef.current.clear();
    setRushScore(0);
    setRushTime(300);
    setRushActive(true);
    await loadRush();
  }, [loadRush]);

  const handleRushSolved = useCallback(() => {
    logAttempt(rushPuzzle, true);
    setRushScore((s) => s + 1);
    void loadRush();
  }, [rushPuzzle, logAttempt, loadRush]);

  const handleRushFailed = useCallback(() => {
    logAttempt(rushPuzzle, false);
    setRushActive(false);
    setRushBestScore((best) => Math.max(best, rushScore));
  }, [rushPuzzle, logAttempt, rushScore]);

  // === Review (spaced repetition) ===
  const reviewPuzzle = reviewQueue[reviewIndex] ?? null;

  const advanceReview = useCallback(() => {
    setReviewDue((d) => Math.max(0, d - 1));
    if (reviewIndex + 1 < reviewQueue.length) {
      setReviewIndex((i) => i + 1);
    } else {
      // Exhausted the batch — pull the next set of due puzzles.
      loadReviews();
    }
  }, [reviewIndex, reviewQueue.length, loadReviews]);

  const handleReviewSolved = useCallback(() => {
    logAttempt(reviewPuzzle, true);
    advanceReview();
  }, [reviewPuzzle, logAttempt, advanceReview]);

  const handleReviewFailed = useCallback(() => {
    // Record the miss (reschedules it sooner); let the user retry on the board.
    logAttempt(reviewPuzzle, false);
  }, [reviewPuzzle, logAttempt]);

  const handleSkipReview = useCallback(() => {
    advanceReview();
  }, [advanceReview]);

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
            <TabsList className="grid w-full grid-cols-4 max-w-xl">
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
              <TabsTrigger value="review">
                <RotateCcw className="h-4 w-4 mr-2" />
                Review
                {reviewDue > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary-600 text-white text-xs px-1.5 py-0.5 leading-none">
                    {reviewDue}
                  </span>
                )}
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
                        Solve today&apos;s puzzle to maintain your streak
                      </CardDescription>
                    </div>
                    {dailyPuzzle && (
                      <Badge variant="outline" className="font-mono">
                        Rating: {dailyPuzzle.rating}
                      </Badge>
                    )}
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
                  ) : dailyPuzzle ? (
                    <PuzzleBoard
                      key={dailyPuzzle.id}
                      fen={dailyPuzzle.fen}
                      moves={dailyPuzzle.moves}
                      rating={dailyPuzzle.rating}
                      themes={dailyPuzzle.themes.map(formatTheme)}
                      onSolved={handleDailySolved}
                      onFailed={handleDailyFailed}
                    />
                  ) : (
                    <BoardLoading />
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
                        {practiceTheme
                          ? `Theme: ${formatTheme(practiceTheme)}`
                          : 'Unlimited puzzles, matched to your rating'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {practiceTheme && (
                        <Button variant="ghost" size="sm" onClick={() => selectTheme(null)}>
                          Clear theme
                        </Button>
                      )}
                      {practicePuzzle && (
                        <Badge variant="outline" className="font-mono">
                          Rating: {practicePuzzle.rating}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {practicePuzzle && !loadingPractice ? (
                    <PuzzleBoard
                      key={practicePuzzle.id}
                      fen={practicePuzzle.fen}
                      moves={practicePuzzle.moves}
                      rating={practicePuzzle.rating}
                      themes={practicePuzzle.themes.map(formatTheme)}
                      onSolved={handlePracticeSolved}
                      onFailed={handlePracticeFailed}
                      onSkip={handleNextPractice}
                    />
                  ) : (
                    <BoardLoading />
                  )}
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
                      <Badge className="font-mono text-lg px-4 py-2">Score: {rushScore}</Badge>
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
                          You have 5 minutes to solve as many puzzles as possible. One wrong
                          move and the game is over!
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
                  ) : rushPuzzle ? (
                    <PuzzleBoard
                      key={`rush-${rushPuzzle.id}`}
                      fen={rushPuzzle.fen}
                      moves={rushPuzzle.moves}
                      rating={rushPuzzle.rating}
                      themes={rushPuzzle.themes.map(formatTheme)}
                      onSolved={handleRushSolved}
                      onFailed={handleRushFailed}
                      showRating={false}
                      showHintButton={false}
                    />
                  ) : (
                    <BoardLoading />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Review (spaced repetition) */}
            <TabsContent value="review" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-primary-600" />
                        Review
                      </CardTitle>
                      <CardDescription>
                        Re-solve puzzles you previously missed, scheduled by spaced repetition
                      </CardDescription>
                    </div>
                    {reviewPuzzle && (
                      <Badge variant="outline" className="font-mono">
                        {reviewDue} due
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingReview ? (
                    <BoardLoading />
                  ) : reviewPuzzle ? (
                    <PuzzleBoard
                      key={`review-${reviewPuzzle.id}`}
                      fen={reviewPuzzle.fen}
                      moves={reviewPuzzle.moves}
                      rating={reviewPuzzle.rating}
                      themes={reviewPuzzle.themes.map(formatTheme)}
                      onSolved={handleReviewSolved}
                      onFailed={handleReviewFailed}
                      onSkip={handleSkipReview}
                    />
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
                      <h2 className="text-2xl font-bold">All caught up!</h2>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        No puzzles are due for review right now. Missed puzzles from Daily,
                        Practice, and Rush will show up here to reinforce your weak spots.
                      </p>
                      <Button variant="outline" onClick={() => setCurrentTab('practice')}>
                        Practice Puzzles
                      </Button>
                    </div>
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
                  <div className="text-4xl font-bold text-yellow-500">{rushBestScore}</div>
                  <div className="text-sm text-muted-foreground">Puzzles in 5 minutes</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theme Categories — click to practice that theme */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Puzzle Themes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(themes.length ? themes.slice(0, 12) : []).map(({ theme, count }) => (
                  <Badge
                    key={theme}
                    variant={practiceTheme === theme ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => selectTheme(theme)}
                    title={`${count} puzzles`}
                  >
                    {formatTheme(theme)}
                  </Badge>
                ))}
                {themes.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Seed the database to browse themes.
                  </p>
                )}
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
                  If you&apos;re stuck, look for undefended pieces
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BoardLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-3">Loading puzzle…</span>
    </div>
  );
}
