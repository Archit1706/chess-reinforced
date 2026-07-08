'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Crown,
  BookOpen,
  Puzzle,
  Swords,
  Zap,
  Brain,
  ArrowRight,
  Check,
  Library,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroBoard } from '@/components/landing/HeroBoard';

const features = [
  {
    icon: BookOpen,
    title: 'Interactive Lessons',
    description:
      '13 modules and 65+ lessons from piece movement to advanced endgames — with live boards you play on, not just read.',
  },
  {
    icon: Puzzle,
    title: 'Real Lichess Puzzles',
    description:
      'A daily puzzle plus unlimited practice from the open Lichess puzzle database, matched to your rating — and a 5-minute Puzzle Rush mode.',
  },
  {
    icon: Brain,
    title: 'Spaced Repetition',
    description:
      'Puzzles you miss come back for review right when you’re about to forget them, so weak spots actually get fixed.',
  },
  {
    icon: Swords,
    title: 'Play Stockfish',
    description:
      'An adjustable opponent from 800 to 2500 ELO, with on-demand hints — and a built-in fallback engine so the computer always replies.',
  },
  {
    icon: Zap,
    title: 'Game Review',
    description:
      'Move-by-move accuracy with blunders flagged, an eval graph, and “train your mistakes” puzzles built from your own games.',
  },
  {
    icon: Library,
    title: 'Famous Games',
    description:
      'Step through classics like Morphy’s Opera Game and Fischer’s Game of the Century, move by move.',
  },
];

// The real seeded curriculum — module titles per level, from prisma/seed.ts.
const learningPath = [
  {
    level: 'Beginner',
    piece: '♙',
    tagline: 'Learn how the game works',
    modules: [
      'Piece Movement',
      'Basic Tactics',
      'Checkmate Patterns',
      'Rules & Special Moves',
      'Reading Chess Notation',
    ],
    dot: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    ring: 'ring-green-500/30',
    bar: 'from-green-500/80 to-green-500/0',
  },
  {
    level: 'Intermediate',
    piece: '♘',
    tagline: 'Turn rules into plans',
    modules: [
      'Opening Principles',
      'Endgame Basics',
      'Middlegame Strategy',
      'Advanced Tactics',
      'Strategic Thinking',
    ],
    dot: 'bg-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    ring: 'ring-yellow-500/30',
    bar: 'from-yellow-500/80 to-yellow-500/0',
  },
  {
    level: 'Advanced',
    piece: '♕',
    tagline: 'Play like you mean it',
    modules: ['Popular Openings', 'Attacking the King', 'Advanced Endgames'],
    dot: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    ring: 'ring-orange-500/30',
    bar: 'from-orange-500/80 to-orange-500/0',
  },
];

const heroStats = [
  '65+ interactive lessons',
  'Real Lichess puzzles',
  'Stockfish · 800–2500 ELO',
];

/** Slow-drifting oversized glyphs behind the hero content. */
function FloatingPieces() {
  const reduceMotion = useReducedMotion();
  const pieces = [
    { glyph: '♞', className: 'left-[4%] top-[12%] text-[9rem]', duration: 13, drift: 22 },
    { glyph: '♛', className: 'right-[6%] top-[6%] text-[11rem]', duration: 17, drift: 28 },
    { glyph: '♜', className: 'left-[12%] bottom-[8%] text-[8rem]', duration: 15, drift: 18 },
    { glyph: '♟', className: 'right-[16%] bottom-[16%] text-[6rem]', duration: 11, drift: 16 },
  ];
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className={`absolute select-none leading-none text-primary-400/[0.07] ${p.className}`}
          animate={reduceMotion ? undefined : { y: [0, -p.drift, 0], rotate: [0, i % 2 ? 4 : -4, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut' }}
        >
          {p.glyph}
        </motion.span>
      ))}
    </div>
  );
}

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.6, ease: [0.22, 0.9, 0.3, 1] as const },
  }),
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ============ Hero — a dark stage, in both themes ============ */}
      <section className="relative overflow-hidden bg-[#081209] text-white">
        {/* Atmosphere: spotlight, board-grid ghost, vignette, grain */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(58% 55% at 70% 38%, rgba(34,197,94,0.13) 0%, rgba(34,197,94,0.04) 45%, transparent 70%), radial-gradient(40% 40% at 18% 80%, rgba(34,197,94,0.08) 0%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(70% 70% at 50% 40%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(70% 70% at 50% 40%, black, transparent)',
          }}
        />
        <FloatingPieces />

        <div className="container relative mx-auto px-4 pt-16 pb-20 sm:pt-24 sm:pb-24 lg:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
            {/* Copy */}
            <div className="text-center lg:text-left">
              <motion.div variants={reveal} initial="hidden" animate="visible" custom={0}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-400/30 bg-primary-400/10 px-4 py-1.5 text-sm text-primary-300">
                  <Zap className="h-3.5 w-3.5" />
                  Powered by Stockfish 18 — free, in your browser
                </span>
              </motion.div>

              <motion.h1
                variants={reveal}
                initial="hidden"
                animate="visible"
                custom={1}
                className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
              >
                Chess, <span className="text-primary-400">reinforced.</span>
              </motion.h1>

              <motion.p
                variants={reveal}
                initial="hidden"
                animate="visible"
                custom={2}
                className="mx-auto mt-6 max-w-xl text-lg text-white/70 lg:mx-0"
              >
                Interactive lessons, real Lichess puzzles with spaced repetition, an
                adjustable Stockfish opponent, and move-by-move game reviews — no
                account required.
              </motion.p>

              <motion.div
                variants={reveal}
                initial="hidden"
                animate="visible"
                custom={3}
                className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
              >
                <Link href="/lessons">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary-500 hover:bg-primary-400 text-primary-950 font-semibold"
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Start Learning
                  </Button>
                </Link>
                <Link href="/play">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Swords className="mr-2 h-5 w-5" />
                    Play Now
                  </Button>
                </Link>
              </motion.div>

              <motion.ul
                variants={reveal}
                initial="hidden"
                animate="visible"
                custom={4}
                className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/50 lg:justify-start"
              >
                {heroStats.map((stat) => (
                  <li key={stat} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-primary-400" />
                    {stat}
                  </li>
                ))}
              </motion.ul>
            </div>

            {/* Animated 3D board */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 0.9, 0.3, 1] }}
            >
              <HeroBoard />
            </motion.div>
          </div>
        </div>

        {/* Bottom fade into the page background */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* ============ Features ============ */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to improve
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Learn a concept, drill it with puzzles, test it against the engine, then
              review the game to see what stuck.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="card-hover">
                  <CardHeader className="pb-2">
                    <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ Learning Path — pawn to queen ============ */}
      <section className="py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              A structured path, start to finish
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Thirteen modules take you from your first pawn push to advanced strategy,
              with progress tracked lesson by lesson.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto pt-14">
            {/* Connector line through the stage markers (desktop) */}
            <div
              aria-hidden
              className="hidden lg:block absolute left-[16.66%] right-[16.66%] top-[3.5rem] h-px bg-gradient-to-r from-green-500/50 via-yellow-500/50 to-orange-500/50"
            />

            <div className="grid gap-12 lg:gap-6 lg:grid-cols-3">
              {learningPath.map((level, index) => (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ delay: index * 0.12, duration: 0.55, ease: [0.22, 0.9, 0.3, 1] }}
                  className="relative"
                >
                  {/* Stage marker — the piece you've "become" at this level */}
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full bg-background ring-2 ${level.ring} shadow-md`}
                    >
                      <span className={`text-3xl leading-none select-none ${level.text}`}>
                        {level.piece}
                      </span>
                    </div>
                  </div>

                  <Link href="/lessons" className="group block h-full">
                    <Card className="relative h-full overflow-hidden pt-8 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                      {/* Level color accent */}
                      <div
                        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${level.bar}`}
                      />
                      {/* Glyph watermark */}
                      <span
                        aria-hidden
                        className="absolute -right-4 -bottom-8 text-[9rem] leading-none select-none opacity-[0.05] transition-opacity duration-300 group-hover:opacity-[0.09]"
                      >
                        {level.piece}
                      </span>

                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-xl">{level.level}</CardTitle>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${level.dot}`} />
                            {level.modules.length} modules
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{level.tagline}</p>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2.5">
                          {level.modules.map((title) => (
                            <li
                              key={title}
                              className="flex items-center gap-2.5 text-sm text-muted-foreground"
                            >
                              <Check className={`h-4 w-4 shrink-0 ${level.text}`} />
                              {title}
                            </li>
                          ))}
                        </ul>
                        <div
                          className={`mt-5 flex items-center gap-1 text-sm font-medium ${level.text} opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0`}
                        >
                          Explore lessons
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center mt-14">
            <Link href="/lessons">
              <Button size="lg">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-24 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <Crown className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Ready to improve your chess?
          </h2>
          <p className="text-lg opacity-90 mb-2 max-w-2xl mx-auto">
            Free, with no sign-up required — your progress saves right in your browser.
          </p>
          <p className="text-sm opacity-75 mb-8 max-w-2xl mx-auto">
            Create an account whenever you like to sync progress across devices.
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
                className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white/10 hover:text-white"
              >
                Try the Daily Puzzle
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============ Footer ============ */}
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
              <Link href="/study" className="hover:text-foreground">
                Study
              </Link>
              <Link href="/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Stockfish engine · puzzles from the Lichess open database
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
