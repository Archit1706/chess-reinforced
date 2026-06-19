/** Client-side famous-game access. Graceful: returns empty/null on error. */

import type { FamousGameDetail, FamousGameSummary } from './types';

export async function fetchFamousGames(): Promise<FamousGameSummary[]> {
  try {
    const res = await fetch('/api/famous-games');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as FamousGameSummary[];
  } catch (error) {
    console.warn('Failed to load famous games:', error);
    return [];
  }
}

export async function fetchFamousGame(id: string): Promise<FamousGameDetail | null> {
  try {
    const res = await fetch(`/api/famous-games/${id}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as FamousGameDetail;
  } catch (error) {
    console.warn('Failed to load famous game:', error);
    return null;
  }
}
