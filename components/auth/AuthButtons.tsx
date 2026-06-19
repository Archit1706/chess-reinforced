'use client';

import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';

/** True only when a Clerk publishable key was present at build time. */
export const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Sign-in / account controls. Renders nothing (and touches no Clerk context)
 * when Clerk isn't configured, so the navbar still works in guest mode.
 */
export function AuthButtons() {
  if (!clerkEnabled) return null;

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button size="sm">Sign up</Button>
        </SignUpButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
