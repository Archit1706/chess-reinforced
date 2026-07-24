'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/lessons/Markdown';
import { LessonBoard } from '@/components/lessons/LessonBoard';
import { LESSON_DEMOS, framesFromMoves } from '@/components/lessons/lessonDemos';
import { useUserStore } from '@/store/user-store';
import { fetchLesson, setLessonComplete, fetchModules } from '@/lib/lessons/client';
import type { LessonDetail, ModuleDTO } from '@/lib/lessons/types';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  RotateCcw,
  Star,
  Gamepad2,
  Sparkles,
  Trophy,
} from 'lucide-react';

type Status = 'loading' | 'ready' | 'notfound';

// The lessons API returns modules ordered by level *alphabetically*
// (advanced < beginner < intermediate); re-rank to true teaching order so the
// prev/next arrows follow the curriculum, crossing module boundaries cleanly.
const LEVEL_RANK: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

interface SeqItem {
  slug: string;
  title: string;
  moduleSlug: string;
  moduleTitle: string;
}

/** Flatten every module into one pedagogical lesson sequence. */
function buildSequence(modules: ModuleDTO[]): SeqItem[] {
  const orderedModules = [...modules].sort(
    (a, b) => (LEVEL_RANK[a.level] ?? 99) - (LEVEL_RANK[b.level] ?? 99) || a.order - b.order
  );
  const seq: SeqItem[] = [];
  for (const m of orderedModules) {
    const lessons = [...m.lessons].sort((a, b) => a.order - b.order);
    for (const l of lessons) {
      seq.push({ slug: l.slug, title: l.title, moduleSlug: m.slug, moduleTitle: m.title });
    }
  }
  return seq;
}

export default function LessonDetailPage() {
  const params = useParams<{ module: string; lesson: string }>();
  const router = useRouter();
  const { recordLessonCompleted } = useUserStore();

  const [status, setStatus] = useState<Status>('loading');
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [modules, setModules] = useState<ModuleDTO[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetchLesson(params.lesson).then((data) => {
      if (!active) return;
      if (!data) {
        setStatus('notfound');
        return;
      }
      setLesson(data);
      setStatus('ready');
    });
    // Sibling lessons drive the prev/next arrows and the "Lesson X of Y" strip.
    fetchModules().then((rows) => {
      if (active) setModules(rows);
    });
    return () => {
      active = false;
    };
  }, [params.lesson]);

  /** Persist completion (best-effort) and count it toward the streak once. */
  const markComplete = async (): Promise<void> => {
    if (!lesson || lesson.completed) return;
    setSaving(true);
    const result = await setLessonComplete(lesson.slug, true);
    setSaving(false);
    if (result === null) return; // save failed; leave state unchanged
    setLesson({ ...lesson, completed: result });
    if (result) recordLessonCompleted();
  };

  const toggleComplete = async () => {
    if (!lesson) return;
    const next = !lesson.completed;
    setSaving(true);
    const result = await setLessonComplete(lesson.slug, next);
    setSaving(false);
    if (result === null) return; // save failed; leave state unchanged
    setLesson({ ...lesson, completed: result });
    // Count toward streak/daily stats only when newly completed.
    if (result) recordLessonCompleted();
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-3">Loading lesson…</span>
      </div>
    );
  }

  if (status === 'notfound' || !lesson) {
    return (
      <div className="container mx-auto px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <p className="text-muted-foreground">This lesson doesn&apos;t exist or hasn&apos;t been published yet.</p>
        <Link href="/lessons">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
        </Link>
      </div>
    );
  }

  // Curriculum position: prev/next across the whole sequence, and this lesson's
  // slot within its own module (for the "Lesson X of Y" strip).
  const sequence = modules ? buildSequence(modules) : [];
  const seqIndex = sequence.findIndex((s) => s.slug === lesson.slug);
  const prev = seqIndex > 0 ? sequence[seqIndex - 1] : null;
  const next = seqIndex >= 0 && seqIndex < sequence.length - 1 ? sequence[seqIndex + 1] : null;

  const currentModule = modules?.find((m) => m.slug === lesson.moduleSlug);
  const moduleLessons = currentModule
    ? [...currentModule.lessons].sort((a, b) => a.order - b.order)
    : [];
  const posInModule = moduleLessons.findIndex((l) => l.slug === lesson.slug) + 1;

  const goNext = () => {
    if (next) router.push(`/lessons/${next.moduleSlug}/${next.slug}`);
    else router.push('/lessons');
  };

  /** Primary CTA: record completion (if new), then move on to the next lesson. */
  const completeAndContinue = async () => {
    await markComplete(); // best-effort; flow continues regardless
    goNext();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-muted-foreground flex items-center gap-1">
        <Link href="/lessons" className="hover:text-foreground">
          Lessons
        </Link>
        <span>/</span>
        <span>{lesson.moduleTitle}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          {lesson.completed && (
            <Badge className="bg-green-500 text-white shrink-0">
              <Check className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-2">{lesson.description}</p>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {lesson.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            Difficulty {lesson.difficulty}/5
          </span>
          {posInModule > 0 && moduleLessons.length > 0 && (
            <span>
              Lesson {posInModule} of {moduleLessons.length} · {lesson.moduleTitle}
            </span>
          )}
        </div>

        {/* Module progress: where this lesson sits, and what's already done. */}
        {moduleLessons.length > 1 && (
          <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
            {moduleLessons.map((l) => (
              <span
                key={l.slug}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  l.slug === lesson.slug
                    ? 'w-7 bg-primary-600'
                    : l.completed
                      ? 'w-3 bg-green-500'
                      : 'w-3 bg-muted'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Topic demo (animated or interactive), matched to the lesson */}
      {(() => {
        const demo = LESSON_DEMOS[lesson.slug];
        if (!demo) return null;
        return (
          <Card className="mb-6 border-primary-200 dark:border-primary-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary-600" />
                {demo.mode === 'interactive' ? 'Try it on the board' : 'See it in action'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <LessonBoard
                interactive={demo.mode === 'interactive'}
                fen={demo.fen}
                frames={
                  demo.mode === 'animate'
                    ? framesFromMoves(demo.fen, demo.moves ?? [])
                    : undefined
                }
                autoPlay={demo.autoPlay}
                flip={demo.flip}
                caption={demo.caption}
              />
            </CardContent>
          </Card>
        );
      })()}

      {/* Content */}
      <Card>
        <CardContent className="prose-none pt-6">
          <Markdown content={lesson.content} />
        </CardContent>
      </Card>

      {/* Always-available practice sandbox */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-primary-600" />
            Practice board
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <LessonBoard
            interactive
            caption="A free board to experiment — make any legal moves you like."
          />
        </CardContent>
      </Card>

      {/* Primary action: complete this lesson and move straight to the next. */}
      <div className="mt-8">
        {next ? (
          <Button
            size="lg"
            className="w-full"
            onClick={completeAndContinue}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : lesson.completed ? (
              <ArrowRight className="h-5 w-5 mr-2" />
            ) : (
              <Check className="h-5 w-5 mr-2" />
            )}
            {lesson.completed ? 'Next lesson' : 'Complete & continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={lesson.completed ? () => router.push('/lessons') : markComplete}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : lesson.completed ? (
              <Trophy className="h-5 w-5 mr-2" />
            ) : (
              <Check className="h-5 w-5 mr-2" />
            )}
            {lesson.completed ? 'Finish — back to all lessons' : 'Mark complete'}
          </Button>
        )}
      </div>

      {/* Prev / next lesson navigation across the whole curriculum. */}
      <nav className="mt-4 grid grid-cols-2 gap-3">
        {prev ? (
          <Link
            href={`/lessons/${prev.moduleSlug}/${prev.slug}`}
            className="rounded-lg border p-3 transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" />
              Previous
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">{prev.title}</span>
          </Link>
        ) : (
          <Link
            href="/lessons"
            className="rounded-lg border p-3 transition-colors hover:bg-muted"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" />
              All lessons
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">Course overview</span>
          </Link>
        )}
        {next ? (
          <Link
            href={`/lessons/${next.moduleSlug}/${next.slug}`}
            className="rounded-lg border p-3 text-right transition-colors hover:bg-muted"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next
              <ArrowRight className="h-3 w-3" />
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">{next.title}</span>
          </Link>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-right">
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              End of curriculum
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium">🎉 Final lesson</span>
          </div>
        )}
      </nav>

      {/* Reversible completion toggle, kept secondary. */}
      {lesson.completed && (
        <div className="mt-3 text-center">
          <Button onClick={toggleComplete} disabled={saving} variant="ghost" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Mark as not done
          </Button>
        </div>
      )}
    </div>
  );
}
