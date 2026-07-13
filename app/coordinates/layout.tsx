import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chess Coordinates Trainer',
  description:
    'Learn to read the board fast. This free 30-second drill quizzes you on chess square names (a1–h8) from both White and Black — the quickest way to master coordinates and notation.',
  alternates: { canonical: '/coordinates' },
  openGraph: {
    url: '/coordinates',
    title: 'Chess Coordinates Trainer — Chess Reinforced',
    description:
      'A free 30-second drill to master chess square names (a1–h8) from both sides of the board.',
  },
};

export default function CoordinatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
