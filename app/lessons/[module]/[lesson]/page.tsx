'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Markdown } from '@/components/lessons/Markdown';
import { useUserStore } from '@/store/user-store';
import { fetchLesson, setLessonComplete } from '@/lib/lessons/client';
import type { LessonDetail } from '@/lib/lessons/types';
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  RotateCcw,
  Star,
} from 'lucide-react';

type Status = 'loading' | 'ready' | 'notfound';

export default function LessonDetailPage() {
  const params = useParams<{ module: string; lesson: string }>();
  const { recordLessonCompleted } = useUserStore();

  const [status, setStatus] = useState<Status>('loading');
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
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
    return () => {
      active = false;
    };
  }, [params.lesson]);

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
        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {lesson.estimatedMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            Difficulty {lesson.difficulty}/5
          </span>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="prose-none pt-6">
          <Markdown content={lesson.content} />
        </CardContent>
      </Card>

      {/* Footer actions */}
      <div className="mt-8 flex items-center justify-between">
        <Link href="/lessons">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            All Lessons
          </Button>
        </Link>

        <Button onClick={toggleComplete} disabled={saving} variant={lesson.completed ? 'outline' : 'default'}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : lesson.completed ? (
            <RotateCcw className="h-4 w-4 mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          {lesson.completed ? 'Mark as not done' : 'Mark complete'}
        </Button>
      </div>
    </div>
  );
}
