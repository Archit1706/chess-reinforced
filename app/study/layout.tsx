import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Famous Chess Games',
  description:
    'Replay the greatest games in chess history move by move — Morphy’s Opera Game, Fischer’s Game of the Century, the Immortal and Evergreen Games — with notation and instant navigation.',
  alternates: { canonical: '/study' },
  openGraph: {
    url: '/study',
    title: 'Study Famous Chess Games — Chess Reinforced',
    description:
      'Replay chess classics move by move: the Opera Game, Game of the Century, Immortal and Evergreen Games.',
  },
};

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
