/**
 * Clerk authentication helpers (server-side).
 *
 * The whole module is written to **degrade gracefully**: when Clerk env keys
 * are absent the app runs in anonymous "guest" mode (state lives in
 * localStorage, exactly as before), so it still builds and works locally before
 * any keys are configured. Once `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
 * `CLERK_SECRET_KEY` are set, real accounts and server-side persistence kick in.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import type { User } from '@prisma/client';
import { prisma } from '@/lib/db';

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}

/** The signed-in Clerk user id, or null when signed out / not configured. */
export function getClerkUserId(): string | null {
  if (!isClerkConfigured()) return null;
  try {
    return auth().userId ?? null;
  } catch {
    // `auth()` throws if clerkMiddleware didn't run (e.g. misconfiguration).
    return null;
  }
}

/**
 * Fetch (or lazily provision) the Prisma `User` row for the signed-in Clerk
 * user. Returns null when there is no authenticated user.
 */
export async function getOrCreateCurrentUser(): Promise<User | null> {
  const clerkId = getClerkUserId();
  if (!clerkId) return null;

  const existing = await prisma.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  // First sign-in for this account: create the row from the Clerk profile.
  const cu = await currentUser();
  const baseUsername =
    cu?.username ||
    cu?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    `user_${clerkId.slice(-8)}`;
  const displayName =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(' ') || baseUsername;
  const imageUrl = cu?.imageUrl ?? null;

  // `username` is unique; retry once with a suffix on collision.
  try {
    return await prisma.user.create({
      data: { clerkId, username: baseUsername, displayName, imageUrl },
    });
  } catch {
    return await prisma.user.create({
      data: {
        clerkId,
        username: `${baseUsername}_${clerkId.slice(-6)}`,
        displayName,
        imageUrl,
      },
    });
  }
}
