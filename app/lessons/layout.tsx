import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Interactive Chess Lessons',
  description:
    'Learn chess from scratch with 13 modules and 65+ interactive lessons — piece movement, tactics, checkmate patterns, openings, endgames and more, on live boards you play, not just read.',
  alternates: { canonical: '/lessons' },
  openGraph: {
    url: '/lessons',
    title: 'Free Interactive Chess Lessons — Chess Reinforced',
    description:
      'Learn chess from scratch with 13 modules and 65+ interactive lessons on live boards you play.',
  },
};

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
