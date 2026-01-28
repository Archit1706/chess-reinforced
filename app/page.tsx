'use client';

import React from 'react';
import Link from 'next/link';
import {
  Crown,
  BookOpen,
  Puzzle,
  Swords,
  Zap,
  Brain,
  Trophy,
  TrendingUp,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: BookOpen,
    title: 'Structured Learning Path',
    description:
      'Progress through beginner to advanced lessons covering tactics, openings, and endgames.',
  },
  {
    icon: Puzzle,
    title: 'Daily Puzzles',
    description:
      'Sharpen your tactical vision with daily puzzles tailored to your skill level.',
  },
  {
    icon: Swords,
    title: 'Play Against AI',
    description:
      'Challenge Stockfish at adjustable difficulty levels from 800 to 2500 ELO.',
  },
  {
    icon: Brain,
    title: 'Move Analysis',
    description:
      'Get instant feedback on your moves with engine-powered analysis and suggestions.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    description:
      'Track your improvement with detailed statistics, charts, and skill estimates.',
  },
  {
    icon: Trophy,
    title: 'Achievements',
    description:
      'Earn achievements and maintain daily streaks to stay motivated on your chess journey.',
  },
];

const learningPath = [
  {
    level: 'Beginner',
    topics: ['Piece movement', 'Basic tactics', 'Checkmate patterns'],
    color: 'bg-green-500',
  },
  {
    level: 'Intermediate',
    topics: ['Opening principles', 'Middle game strategy', 'Endgame basics'],
    color: 'bg-yellow-500',
  },
  {
    level: 'Advanced',
    topics: ['Popular openings', 'Positional play', 'Advanced tactics'],
    color: 'bg-orange-500',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-background dark:from-primary-950/20 dark:to-background">
        <div className="container mx-auto px-4 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4" variant="secondary">
              <Zap className="h-3 w-3 mr-1" />
              Powered by Stockfish
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Master Chess with{' '}
              <span className="text-primary-600">Interactive</span> Learning
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A comprehensive chess learning platform with structured lessons, daily
              puzzles, and AI-powered training. Start your journey from beginner to
              master.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/lessons">
                <Button size="lg" className="w-full sm:w-auto">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Start Learning
                </Button>
              </Link>
              <Link href="/play">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Swords className="mr-2 h-5 w-5" />
                  Play Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Decorative chess pieces */}
          <div className="absolute -bottom-10 left-1/4 opacity-5 text-9xl">♔</div>
          <div className="absolute -bottom-10 right-1/4 opacity-5 text-9xl">♕</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Improve</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines the best learning methods with powerful tools to
              help you become a better chess player.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="card-hover">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning Path Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Structured Learning Path</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Progress through carefully designed modules that take you from the
              basics to advanced strategies.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {learningPath.map((level, index) => (
              <div key={level.level} className="flex gap-6 mb-8 last:mb-0">
                {/* Progress indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full ${level.color} text-white flex items-center justify-center font-bold text-lg`}
                  >
                    {index + 1}
                  </div>
                  {index < learningPath.length - 1 && (
                    <div className="w-0.5 flex-1 bg-border my-2" />
                  )}
                </div>

                {/* Content */}
                <Card className="flex-1">
                  <CardHeader>
                    <CardTitle>{level.level}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {level.topics.map((topic) => (
                        <li key={topic} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary-600" />
                          {topic}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/lessons">
              <Button size="lg">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <Crown className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Improve Your Chess?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of players who have improved their game with our
            interactive lessons and daily practice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/lessons">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Start Free Lessons
              </Button>
            </Link>
            <Link href="/puzzles">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10"
              >
                Try Daily Puzzle
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary-600" />
              <span className="font-bold">Chess Reinforced</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/lessons" className="hover:text-foreground">
                Lessons
              </Link>
              <Link href="/puzzles" className="hover:text-foreground">
                Puzzles
              </Link>
              <Link href="/play" className="hover:text-foreground">
                Play
              </Link>
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Made with Stockfish Chess Engine
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
