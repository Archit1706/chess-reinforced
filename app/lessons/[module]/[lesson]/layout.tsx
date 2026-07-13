import type { Metadata } from 'next';
import { titleFromSlug } from '@/lib/site';

// Give every lesson page a unique, keyword-relevant title and canonical derived
// from its slug — no DB lookup needed, so it can never fail at build/request.
export function generateMetadata({
  params,
}: {
  params: { module: string; lesson: string };
}): Metadata {
  const lessonTitle = titleFromSlug(params.lesson);
  const path = `/lessons/${params.module}/${params.lesson}`;
  return {
    // Absolute so branding is consistent regardless of template cascade.
    title: { absolute: `${lessonTitle} — Chess Lesson · Chess Reinforced` },
    description: `Learn ${lessonTitle} with a free, interactive play-along chess lesson from the Chess Reinforced curriculum.`,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: `${lessonTitle} — Chess Lesson · Chess Reinforced`,
      description: `Learn ${lessonTitle} with a free, interactive play-along chess lesson.`,
    },
  };
}

export default function LessonLayout({ children }: { children: React.ReactNode }) {
  return children;
}
