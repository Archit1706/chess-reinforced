'use client';

import React, { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Trophy,
  Target,
  BookOpen,
  Swords,
  Flame,
  TrendingUp,
  Star,
  Zap,
  Award,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTheme } from '@/lib/puzzles/lichess';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import type { DashboardData } from '@/lib/dashboard/repository';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const { user, startSession } = useUserStore();
  const [dash, setDash] = useState<DashboardData | null>(null);

  useEffect(() => {
    startSession();
    let active = true;
    fetch('/api/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setDash(data);
      })
      .catch(() => {
        if (active) setDash(null);
      });
    return () => {
      active = false;
    };
  }, [startSession]);

  const stats = user?.stats || {
    estimatedElo: 800,
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    gamesDraw: 0,
    winRate: 0,
    puzzlesSolved: 0,
    puzzlesFailed: 0,
    puzzleSuccessRate: 0,
    puzzleStreak: 0,
    bestPuzzleStreak: 0,
    currentStreak: 0,
    longestStreak: 0,
  };

  // Game results derived from real stored counters.
  const gameResults = [
    { name: 'Wins', value: stats.gamesWon, color: '#22c55e' },
    { name: 'Losses', value: stats.gamesLost, color: '#ef4444' },
    { name: 'Draws', value: stats.gamesDraw, color: '#94a3b8' },
  ];
  const hasGames = stats.gamesPlayed > 0;

  // Achievements evaluated against real stats.
  const achievements = [
    { id: 1, name: 'First Tactic', description: 'Solve your first puzzle', icon: Target, unlocked: stats.puzzlesSolved >= 1 },
    { id: 2, name: 'First Win', description: 'Win a game vs the computer', icon: Swords, unlocked: stats.gamesWon >= 1 },
    { id: 3, name: 'Puzzle Solver', description: 'Solve 100 puzzles', icon: Zap, unlocked: stats.puzzlesSolved >= 100 },
    { id: 4, name: 'On Fire', description: 'Reach a 7-day streak', icon: Flame, unlocked: stats.longestStreak >= 7 },
    { id: 5, name: 'Rising Star', description: 'Reach 1000 ELO', icon: Star, unlocked: stats.estimatedElo >= 1000 },
    { id: 6, name: 'Veteran', description: 'Play 50 games', icon: Award, unlocked: stats.gamesPlayed >= 50 },
    { id: 7, name: 'Tactical Master', description: 'Solve 500 puzzles', icon: Award, unlocked: stats.puzzlesSolved >= 500 },
    { id: 8, name: 'Grandmaster', description: 'Reach 2000 ELO', icon: Trophy, unlocked: stats.estimatedElo >= 2000 },
  ];

  const activity = dash?.activity ?? [];
  const hasActivity = activity.some((d) => d.solved + d.failed > 0);
  const recentAttempts = dash?.recentAttempts ?? [];
  const reviewDue = dash?.reviewDue ?? 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your progress and see how you&apos;re improving
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current ELO</p>
                <p className="text-2xl font-bold">{stats.estimatedElo}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Estimated rating</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Games Played</p>
                <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Swords className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {stats.winRate}% win rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Puzzles Solved</p>
                <p className="text-2xl font-bold">{stats.puzzlesSolved}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {stats.puzzleSuccessRate}% success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Day Streak</p>
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Flame className="h-6 w-6 text-orange-500 animate-flame" />
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Best: {stats.longestStreak} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Puzzle Accuracy */}
        <Card>
          <CardHeader>
            <CardTitle>Puzzle Accuracy</CardTitle>
            <CardDescription>Daily solve rate over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {hasActivity ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activity}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                    <YAxis domain={[0, 100]} className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(v) => [v == null ? '—' : `${v}%`, 'Accuracy']}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Solve puzzles to see your accuracy trend" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Results */}
        <Card>
          <CardHeader>
            <CardTitle>Game Results</CardTitle>
            <CardDescription>Your win / loss / draw ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {hasGames ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gameResults} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {gameResults.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart message="Play a game to see your results" />
              )}
            </div>
            {hasGames && (
              <div className="flex justify-center gap-6 mt-4">
                {gameResults.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Puzzles attempted over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {hasActivity ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <YAxis allowDecimals={false} className="text-xs fill-muted-foreground" tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="solved" fill="#22c55e" name="Solved" stackId="a" />
                  <Bar dataKey="failed" fill="#ef4444" name="Missed" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No puzzle activity yet this week" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Calendar */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle>Activity Calendar</CardTitle>
              <CardDescription>Puzzles, games, and lessons over the last 17 weeks</CardDescription>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-right">
                <div className="text-xl font-bold leading-none">{dash?.currentStreak ?? 0}</div>
                <div className="text-xs text-muted-foreground">day streak</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold leading-none">{dash?.activeDays ?? 0}</div>
                <div className="text-xs text-muted-foreground">active days</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dash?.heatmap && dash.heatmap.length > 0 ? (
            <ActivityHeatmap days={dash.heatmap} />
          ) : (
            <EmptyChart message="No activity yet — play, solve, or learn to fill the calendar" />
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Puzzles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Puzzles</CardTitle>
                <CardDescription>Your latest attempts</CardDescription>
              </div>
              <Link href="/puzzles">
                <Button variant="outline" size="sm">
                  {reviewDue > 0 ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      {reviewDue} to review
                    </>
                  ) : (
                    <>
                      Solve Puzzles
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAttempts.length > 0 ? (
              <div className="space-y-1">
                {recentAttempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-2 w-2 rounded-full', a.solved ? 'bg-green-500' : 'bg-red-500')} />
                      <div>
                        <p className="font-medium">Puzzle · {a.rating}</p>
                        <p className="text-sm text-muted-foreground">
                          {a.themes.map(formatTheme).join(', ') || 'Tactics'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={a.solved ? 'success' : 'destructive'}>
                        {a.solved ? 'Solved' : 'Missed'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">{relativeTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                No puzzle attempts yet.{' '}
                <Link href="/puzzles" className="text-primary-600 hover:underline">
                  Solve your first puzzle
                </Link>
                .
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  {achievements.filter((a) => a.unlocked).length} of {achievements.length} unlocked
                </CardDescription>
              </div>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {achievements.map((achievement) => {
                const Icon = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      'p-3 rounded-lg border transition-colors',
                      achievement.unlocked
                        ? 'bg-muted/50 border-primary-200 dark:border-primary-800'
                        : 'opacity-50'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn('h-4 w-4', achievement.unlocked ? 'text-yellow-500' : 'text-muted-foreground')} />
                      <span className="font-medium text-sm">{achievement.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/lessons">
          <Card className="card-hover cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Continue Learning</h3>
                  <p className="text-sm text-muted-foreground">Pick up where you left off</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/puzzles">
          <Card className="card-hover cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Daily Puzzle</h3>
                  <p className="text-sm text-muted-foreground">Solve today&apos;s challenge</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/play">
          <Card className="card-hover cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Swords className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Play a Game</h3>
                  <p className="text-sm text-muted-foreground">Challenge the computer</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-center text-sm text-muted-foreground px-6">
      {message}
    </div>
  );
}
