import Link from 'next/link';
import { Crown, Home, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Branded 404 page. */
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-xl text-center space-y-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
        <Crown className="h-8 w-8 text-primary-600" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist (or has moved). Pick a different
          square.
        </p>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/lessons">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Browse lessons
          </Link>
        </Button>
      </div>
    </div>
  );
}
