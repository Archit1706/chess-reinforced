import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Progress',
  description: 'Track your chess progress — rating, streaks, puzzle accuracy and an activity heatmap.',
  // User-specific dashboard; keep it out of the search index.
  robots: { index: false, follow: true },
  alternates: { canonical: '/dashboard' },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
