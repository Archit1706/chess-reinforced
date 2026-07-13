import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Games',
  description: 'Review and replay your games against the computer, with analysis and mistake training.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/games' },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
