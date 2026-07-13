import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Customize the board, theme, sound, animations and analysis settings.',
  robots: { index: false, follow: true },
  alternates: { canonical: '/settings' },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
