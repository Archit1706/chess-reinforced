import type { Metadata } from 'next';
import { titleFromSlug } from '@/lib/site';

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const name = titleFromSlug(params.id);
  const path = `/study/${params.id}`;
  return {
    title: { absolute: `${name} — Famous Chess Game · Chess Reinforced` },
    description: `Replay ${name} move by move — one of the great games in chess history — free on Chess Reinforced.`,
    alternates: { canonical: path },
    openGraph: {
      url: path,
      title: `${name} — Famous Chess Game · Chess Reinforced`,
      description: `Replay ${name} move by move, one of chess history's great games.`,
    },
  };
}

export default function StudyGameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
