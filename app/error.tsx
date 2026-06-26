'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Segment-level error boundary. Next.js renders this when a child route or
 * component throws during render. The `reset()` callback retries the segment.
 */
export default function GlobalSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          The page hit an unexpected error. You can try again, or head back home.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Ref: {error.digest}</p>
        )}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
