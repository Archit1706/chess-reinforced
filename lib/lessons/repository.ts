/**
 * Server-side lesson queries (Prisma).
 *
 * Reads the seeded Module/Lesson content and joins per-user LessonProgress so
 * the UI can show real completion state and persist it.
 */

import { prisma } from '@/lib/db';
import type { LessonDetail, LessonSummary, ModuleDTO, LessonLevel } from './types';

/** Modules (ordered by level then position) with their lessons + completion. */
export async function getModulesWithProgress(userId: string): Promise<ModuleDTO[]> {
  const modules = await prisma.module.findMany({
    orderBy: [{ level: 'asc' }, { order: 'asc' }],
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { progress: { where: { userId }, select: { completed: true } } },
      },
    },
  });

  return modules.map((m) => {
    const lessons: LessonSummary[] = m.lessons.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      description: l.description,
      order: l.order,
      difficulty: l.difficulty,
      estimatedMinutes: l.estimatedMinutes,
      completed: l.progress[0]?.completed ?? false,
    }));
    return {
      id: m.id,
      slug: m.slug,
      title: m.title,
      description: m.description,
      level: m.level as LessonLevel,
      order: m.order,
      icon: m.icon,
      lessons,
      completedCount: lessons.filter((l) => l.completed).length,
      totalCount: lessons.length,
    };
  });
}

/** A single lesson (by slug) with its markdown content and completion state. */
export async function getLessonBySlug(
  slug: string,
  userId: string
): Promise<LessonDetail | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: {
      module: { select: { slug: true, title: true } },
      progress: { where: { userId }, select: { completed: true } },
    },
  });
  if (!lesson) return null;

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    difficulty: lesson.difficulty,
    estimatedMinutes: lesson.estimatedMinutes,
    completed: lesson.progress[0]?.completed ?? false,
    moduleSlug: lesson.module.slug,
    moduleTitle: lesson.module.title,
    content: lesson.content,
  };
}

/**
 * Mark a lesson complete/incomplete for a user. Upserts the LessonProgress row.
 * Returns false if the lesson slug doesn't exist.
 */
export async function setLessonCompleted(
  userId: string,
  lessonSlug: string,
  completed: boolean
): Promise<boolean> {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: lessonSlug },
    select: { id: true },
  });
  if (!lesson) return false;

  const completedAt = completed ? new Date() : null;
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id, started: true, completed, completedAt },
    update: { started: true, completed, completedAt },
  });
  return true;
}
