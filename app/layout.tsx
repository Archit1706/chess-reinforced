import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Navbar } from '@/components/layout/Navbar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserSync } from '@/components/auth/UserSync';

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Chess Reinforced - Learn Chess Interactively',
  description:
    'A comprehensive chess learning platform with interactive lessons, puzzles, and AI-powered training.',
  keywords: ['chess', 'learn chess', 'chess puzzles', 'chess lessons', 'chess training'],
  authors: [{ name: 'Chess Reinforced' }],
  openGraph: {
    title: 'Chess Reinforced - Learn Chess Interactively',
    description: 'Master chess with interactive lessons, daily puzzles, and AI-powered training.',
    type: 'website',
  },
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
