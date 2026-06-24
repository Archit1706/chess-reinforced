/**
 * Client-side access to the saved-games API. Graceful: failures resolve to
 * null/empty so a blocked DB or signed-out session never crashes the UI.
 */

import type { GameDetailDTO, GameSummaryDTO, SaveGameInput } from './types';

/** Persist a finished game. Returns the new id, or null on failure. */
export async function saveGameResult(input: SaveGameInput): Promise<string | null> {
  try {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { id: string };
    return data.id;
  } catch (error) {
    console.warn('Failed to save game:', error);
    return null;
  }
}

export async function fetchGames(): Promise<GameSummaryDTO[]> {
  try {
    const res = await fetch('/api/games');
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as GameSummaryDTO[];
  } catch (error) {
    console.warn('Failed to load games:', error);
    return [];
  }
}

export async function fetchGame(id: string): Promise<GameDetailDTO | null> {
  try {
    const res = await fetch(`/api/games/${id}`);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as GameDetailDTO;
  } catch (error) {
    console.warn('Failed to load game:', error);
    return null;
  }
}

/** Delete a game. Returns true on success. */
export async function deleteGame(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/games/${id}`, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.warn('Failed to delete game:', error);
    return false;
  }
}
