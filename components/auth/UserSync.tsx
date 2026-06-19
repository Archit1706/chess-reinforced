'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUserStore } from '@/store/user-store';

/**
 * Keeps the Zustand user store in sync with Clerk's auth state. On sign-in it
 * loads the server-side profile/stats; on sign-out `/api/user` returns 401 and
 * the store falls back to the local guest. Only mounted when Clerk is enabled.
 */
export function UserSync() {
  const { isLoaded, isSignedIn } = useAuth();
  const fetchUser = useUserStore((s) => s.fetchUser);

  useEffect(() => {
    if (!isLoaded) return;
    fetchUser();
  }, [isLoaded, isSignedIn, fetchUser]);

  return null;
}
