import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chess Puzzles & Tactics Trainer',
  description:
    'Sharpen your tactics on real Lichess puzzles matched to your rating. Solve a daily puzzle, train with spaced repetition so weak spots stick, or race the clock in Puzzle Rush — free.',
  alternates: { canonical: '/puzzles' },
  openGraph: {
    url: '/puzzles',
    title: 'Chess Puzzles & Tactics Trainer — Chess Reinforced',
    description:
      'Real Lichess puzzles matched to your rating, a daily puzzle, spaced repetition and Puzzle Rush.',
  },
};

export default function PuzzlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
