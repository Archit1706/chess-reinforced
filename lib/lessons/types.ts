/**
 * Lesson DTOs shared between the API and the client.
 */

export type LessonLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LessonSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  difficulty: number;
  estimatedMinutes: number;
  completed: boolean;
}

export interface ModuleDTO {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: LessonLevel;
  order: number;
  icon: string | null;
  lessons: LessonSummary[];
  completedCount: number;
  totalCount: number;
}

export interface LessonDetail extends LessonSummary {
  moduleSlug: string;
  moduleTitle: string;
  content: string;
}
