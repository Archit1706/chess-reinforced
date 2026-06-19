import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserSync } from '@/components/auth/UserSync';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// Canonical site URL for absolute OG/canonical links. Set NEXT_PUBLIC_APP_URL
// to your production domain on Vercel; falls back to the per-deploy URL.
const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

const title = 'Chess Reinforced — Learn & Improve Your Chess';
const description =
  'Improve your chess for free: play Stockfish at any level, train on real Lichess puzzles with spaced repetition, and get a move-by-move game review with accuracy.';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: '%s · Chess Reinforced',
  },
  description,
  applicationName: 'Chess Reinforced',
  authors: [{ name: 'Chess Reinforced' }],
  keywords: [
    'chess',
    'learn chess',
    'chess puzzles',
    'chess tactics',
    'chess training',
    'play chess vs computer',
    'stockfish',
    'lichess puzzles',
    'game analysis',
    'spaced repetition',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'Chess Reinforced',
    title,
    description,
    // PNG for social scrapers (X/Facebook/LinkedIn/Slack don't render SVG);
    // og.svg is kept in the repo as the editable source.
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Chess Reinforced' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/icon.svg' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#052e16' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>
        <div className="relative min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
        {clerkEnabled && <UserSync />}
      </TooltipProvider>
    </ThemeProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {clerkEnabled ? <ClerkProvider>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
