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
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/store/user-store';
import { fetchModules } from '@/lib/lessons/client';
import type { ModuleDTO } from '@/lib/lessons/types';

const ICONS: Record<string, LucideIcon> = {
  Swords,
  Target,
  Castle,
  Crown,
  BookOpen,
  Lightbulb,
  Zap,
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

export default function LessonsPage() {
  const { startSession } = useUserStore();
  const [modules, setModules] = useState<ModuleDTO[] | null>(null);

  useEffect(() => {
    startSession();
    fetchModules().then(setModules);
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

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Your Progress</h2>
              <p className="text-sm text-muted-foreground">
                {completedLessons} of {totalLessons} lessons completed
              </p>
            </div>
            <span className="text-2xl font-bold text-primary-600">
              {Math.round(overallProgress)}%
            </span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

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
