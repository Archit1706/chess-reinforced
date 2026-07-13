import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Play Chess vs the Computer (Stockfish)',
  description:
    'Play chess against Stockfish at any strength from 800 to 2500 ELO, with on-demand hints and a move-by-move game review afterwards. No sign-up required — start a game in one click.',
  alternates: { canonical: '/play' },
  openGraph: {
    url: '/play',
    title: 'Play Chess vs the Computer (Stockfish) — Chess Reinforced',
    description:
      'Play Stockfish from 800 to 2500 ELO with hints and a full game review. No sign-up needed.',
  },
};

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
