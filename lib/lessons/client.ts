/**
 * Client-side lesson access. Graceful: returns empty/null on error so the UI
 * can show a friendly state rather than crashing.
 */

import type { LessonDetail, ModuleDTO } from './types';

export async function fetchModules(): Promise<ModuleDTO[]> {
  try {
    const res = await fetch('/api/lessons');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as ModuleDTO[];
  } catch (error) {
    console.warn('Failed to load lessons:', error);
    return [];
  }
}

export async function fetchLesson(slug: string): Promise<LessonDetail | null> {
  try {
    const res = await fetch(`/api/lessons/${slug}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as LessonDetail;
  } catch (error) {
    console.warn('Failed to load lesson:', error);
    return null;
  }
}

/** Persist completion; returns the new completed state, or null on failure. */
export async function setLessonComplete(
  slug: string,
  completed: boolean
): Promise<boolean | null> {
  try {
    const res = await fetch(`/api/lessons/${slug}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { completed: boolean };
    return data.completed;
  } catch (error) {
    console.warn('Failed to save lesson progress:', error);
    return null;
  }
}
