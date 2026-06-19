'use client';

import React, { useEffect } from 'react';
import { useUserStore } from '@/store/user-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  TrendingDown,
  Calendar,
  Clock,
  Zap,
  Star,
  Award,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for charts
const eloHistory = [
  { date: 'Week 1', elo: 800 },
  { date: 'Week 2', elo: 850 },
  { date: 'Week 3', elo: 820 },
  { date: 'Week 4', elo: 900 },
  { date: 'Week 5', elo: 950 },
  { date: 'Week 6', elo: 980 },
  { date: 'Week 7', elo: 1020 },
  { date: 'Week 8', elo: 1050 },
];

const weeklyActivity = [
  { day: 'Mon', puzzles: 12, lessons: 2, games: 3 },
  { day: 'Tue', puzzles: 8, lessons: 1, games: 2 },
  { day: 'Wed', puzzles: 15, lessons: 0, games: 5 },
  { day: 'Thu', puzzles: 10, lessons: 3, games: 1 },
  { day: 'Fri', puzzles: 20, lessons: 1, games: 4 },
  { day: 'Sat', puzzles: 25, lessons: 2, games: 6 },
  { day: 'Sun', puzzles: 18, lessons: 2, games: 3 },
];

const gameResults = [
  { name: 'Wins', value: 45, color: '#22c55e' },
  { name: 'Losses', value: 30, color: '#ef4444' },
  { name: 'Draws', value: 15, color: '#94a3b8' },
];

const achievements = [
  { id: 1, name: 'First Steps', description: 'Complete your first lesson', icon: BookOpen, unlocked: true },
  { id: 2, name: 'Puzzle Solver', description: 'Solve 100 puzzles', icon: Target, unlocked: true },
  { id: 3, name: 'On Fire', description: 'Maintain a 7-day streak', icon: Flame, unlocked: true },
  { id: 4, name: 'Rising Star', description: 'Reach 1000 ELO', icon: Star, unlocked: false },
  { id: 5, name: 'Tactical Master', description: 'Solve 500 puzzles', icon: Zap, unlocked: false },
  { id: 6, name: 'Grandmaster', description: 'Reach 2000 ELO', icon: Trophy, unlocked: false },
];

const recentGames = [
  { opponent: 'Stockfish (1200)', result: 'win', date: '2h ago', opening: 'Italian Game' },
  { opponent: 'Stockfish (1400)', result: 'loss', date: '5h ago', opening: 'Sicilian Defense' },
  { opponent: 'Stockfish (1200)', result: 'win', date: '1d ago', opening: "Queen's Gambit" },
  { opponent: 'Stockfish (1000)', result: 'draw', date: '1d ago', opening: 'London System' },
  { opponent: 'Stockfish (1200)', result: 'win', date: '2d ago', opening: 'Italian Game' },
];

export default function DashboardPage() {
  const { user, startSession } = useUserStore();

  useEffect(() => {
    startSession();
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
            <div className="mt-2 flex items-center text-sm text-green-500">
              <TrendingUp className="h-4 w-4 mr-1" />
              +50 this week
            </div>
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
        {/* ELO Progression */}
        <Card>
          <CardHeader>
            <CardTitle>ELO Progression</CardTitle>
            <CardDescription>Your skill rating over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eloHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    className="text-xs fill-muted-foreground"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="elo"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Game Results */}
        <Card>
          <CardHeader>
            <CardTitle>Game Results</CardTitle>
            <CardDescription>Your win/loss/draw ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gameResults}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
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
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {gameResults.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Your activity over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="day"
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-xs fill-muted-foreground"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="puzzles" fill="#eab308" name="Puzzles" />
                <Bar dataKey="games" fill="#3b82f6" name="Games" />
                <Bar dataKey="lessons" fill="#22c55e" name="Lessons" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Games */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Games</CardTitle>
                <CardDescription>Your latest matches</CardDescription>
              </div>
              <Link href="/play">
                <Button variant="outline" size="sm">
                  Play Now
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGames.map((game, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        game.result === 'win'
                          ? 'bg-green-500'
                          : game.result === 'loss'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      )}
                    />
                    <div>
                      <p className="font-medium">{game.opponent}</p>
                      <p className="text-sm text-muted-foreground">{game.opening}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        game.result === 'win'
                          ? 'success'
                          : game.result === 'loss'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {game.result.charAt(0).toUpperCase() + game.result.slice(1)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{game.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>
                  {achievements.filter((a) => a.unlocked).length} of{' '}
                  {achievements.length} unlocked
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
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          achievement.unlocked
                            ? 'text-yellow-500'
                            : 'text-muted-foreground'
                        )}
                      />
                      <span className="font-medium text-sm">{achievement.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {achievement.description}
                    </p>
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
                  <p className="text-sm text-muted-foreground">
                    Pick up where you left off
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Solve today&apos;s challenge
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    Challenge the computer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
