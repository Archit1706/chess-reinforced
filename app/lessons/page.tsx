'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  Clock,
  Swords,
  Castle,
  Crown,
  Target,
  Lightbulb,
  Zap,
  Sparkles,
  PenLine,
  Brain,
  Flame,
  Loader2,
  Puzzle,
  PlayCircle,
  ArrowRight,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user-store';
import { fetchModules } from '@/lib/lessons/client';
import type { ModuleDTO, LessonSummary } from '@/lib/lessons/types';

const ICONS: Record<string, LucideIcon> = {
  Swords,
  Target,
  Castle,
  Crown,
  BookOpen,
  Lightbulb,
  Zap,
  Sparkles,
  PenLine,
  Brain,
  Flame,
};

const levelColors: Record<string, string> = {
  beginner: 'bg-green-500',
  intermediate: 'bg-yellow-500',
  advanced: 'bg-orange-500',
};

function ModuleCard({ module }: { module: ModuleDTO }) {
  const Icon = (module.icon && ICONS[module.icon]) || BookOpen;
  const progress = module.totalCount > 0 ? (module.completedCount / module.totalCount) * 100 : 0;

  return (
    <Card className="card-hover">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary-600" />
          </div>
          <Badge variant="secondary" className={cn('text-white capitalize', levelColors[module.level])}>
            {module.level}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-4">{module.title}</CardTitle>
        <CardDescription>{module.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {module.completedCount}/{module.totalCount} lessons
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          {module.lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/lessons/${module.slug}/${lesson.slug}`}
              className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                {lesson.completed ? (
                  <Check className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />
                )}
                <span className={cn('text-sm', lesson.completed && 'text-muted-foreground line-through')}>
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="h-3 w-3" />
                {lesson.estimatedMinutes}m
              </div>
            </Link>
          ))}
          {module.lessons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">Lessons coming soon</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// The DB returns modules ordered by level *alphabetically* (advanced < beginner
// < intermediate), so re-rank into true pedagogical order before picking the
// lesson to resume.
const LEVEL_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** First not-yet-completed lesson in pedagogical order, or null if all done. */
function findNextLesson(
  modules: ModuleDTO[]
): { module: ModuleDTO; lesson: LessonSummary } | null {
  const ordered = [...modules].sort(
    (a, b) => (LEVEL_RANK[a.level] ?? 99) - (LEVEL_RANK[b.level] ?? 99) || a.order - b.order
  );
  for (const mod of ordered) {
    const lessons = [...mod.lessons].sort((a, b) => a.order - b.order);
    const lesson = lessons.find((l) => !l.completed);
    if (lesson) return { module: mod, lesson };
  }
  return null;
}

/**
 * The "one obvious next action" hero: sends a first-timer straight into the
 * opening lesson and drops a returning learner back where they left off, with
 * overall progress alongside. Removes the "which of 13 modules do I click?"
 * friction. Pure client-side derivation — no extra fetch, works in guest mode.
 */
function ResumeHero({
  modules,
  completedLessons,
  totalLessons,
  overallProgress,
}: {
  modules: ModuleDTO[];
  completedLessons: number;
  totalLessons: number;
  overallProgress: number;
}) {
  // No lessons loaded (e.g. API/DB unavailable): don't fabricate a "complete"
  // celebration or a 0/0 progress bar — let the page fall back to its own state.
  if (totalLessons === 0) return null;

  const next = findNextLesson(modules);
  const started = completedLessons > 0;

  return (
    <Card className="mb-8 border-primary-200 dark:border-primary-800">
      <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {next ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600">
                <Sparkles className="h-4 w-4 shrink-0" />
                {started ? 'Pick up where you left off' : 'New to chess? Start here'}
              </span>
              <h2 className="mt-1 truncate text-2xl font-bold">{next.lesson.title}</h2>
              <p className="text-sm text-muted-foreground">
                {next.module.title} · about {next.lesson.estimatedMinutes} min
              </p>
              <Link
                href={`/lessons/${next.module.slug}/${next.lesson.slug}`}
                className="mt-4 block sm:inline-block"
              >
                <Button size="lg" className="w-full sm:w-auto">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {started ? 'Continue' : 'Start here'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600">
                <Trophy className="h-4 w-4 shrink-0" />
                Curriculum complete
              </span>
              <h2 className="mt-1 text-2xl font-bold">You&apos;ve finished every lesson 🎉</h2>
              <p className="text-sm text-muted-foreground">
                Keep it sharp — practise with puzzles or play a game.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link href="/puzzles">
                  <Button size="lg" className="w-full sm:w-auto">
                    <Puzzle className="mr-2 h-5 w-5" />
                    Solve puzzles
                  </Button>
                </Link>
                <Link href="/play">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    <Swords className="mr-2 h-5 w-5" />
                    Play a game
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 sm:text-right">
          <div className="text-3xl font-bold text-primary-600">
            {Math.round(overallProgress)}%
          </div>
          <p className="text-sm text-muted-foreground">
            {completedLessons} of {totalLessons} lessons
          </p>
          <Progress value={overallProgress} className="mt-2 h-2 w-full sm:w-48" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function LessonsPage() {
  const { startSession } = useUserStore();
  const [modules, setModules] = useState<ModuleDTO[] | null>(null);

  useEffect(() => {
    startSession();
    let active = true;
    fetchModules().then((rows) => {
      if (active) setModules(rows);
    });
    return () => {
      active = false;
    };
  }, [startSession]);

  if (modules === null) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading lessons…</span>
      </div>
    );
  }

  const byLevel = (level: string) => modules.filter((m) => m.level === level);
  const totalLessons = modules.reduce((acc, m) => acc + m.totalCount, 0);
  const completedLessons = modules.reduce((acc, m) => acc + m.completedCount, 0);
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  const renderGrid = (mods: ModuleDTO[]) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mods.map((m) => (
        <ModuleCard key={m.id} module={m} />
      ))}
    </div>
  );

  const levels: { key: string; label: string; dot: string }[] = [
    { key: 'beginner', label: 'Beginner', dot: 'bg-green-500' },
    { key: 'intermediate', label: 'Intermediate', dot: 'bg-yellow-500' },
    { key: 'advanced', label: 'Advanced', dot: 'bg-orange-500' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Learn Chess</h1>
        <p className="text-muted-foreground">
          Master chess through structured lessons from beginner to advanced
        </p>
      </div>

      <ResumeHero
        modules={modules}
        completedLessons={completedLessons}
        totalLessons={totalLessons}
        overallProgress={overallProgress}
      />

      <Tabs defaultValue="all" className="mb-8">
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="beginner">Beginner</TabsTrigger>
          <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-8">
            {levels.map(({ key, label, dot }) => {
              const mods = byLevel(key);
              if (mods.length === 0) return null;
              return (
                <div key={key}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <div className={cn('h-3 w-3 rounded-full', dot)} />
                    {label}
                  </h2>
                  {renderGrid(mods)}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {levels.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-6">
            {renderGrid(byLevel(key))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
