/** Shared types for the saved-games (game history) feature. */

export type GameOutcome = 'win' | 'loss' | 'draw' | 'unknown';

/** Lightweight row for the "My Games" list (no PGN payload). */
export interface GameSummaryDTO {
  id: string;
  createdAt: string; // ISO timestamp
  result: string; // '1-0' | '0-1' | '1/2-1/2' | '*'
  playerColor: string; // 'white' | 'black'
  outcome: GameOutcome; // derived from result + playerColor
  opponentType: string; // 'computer' | 'puzzle'
  opponentElo: number | null;
  openingName: string | null;
  openingEco: string | null;
  analyzed: boolean;
}

/** Full record including PGN for the replay/detail page. */
export interface GameDetailDTO extends GameSummaryDTO {
  pgn: string;
}

/** Payload the client sends to persist a finished game. */
export interface SaveGameInput {
  pgn: string;
  result: string;
  playerColor: string; // accepts 'w' | 'b' | 'white' | 'black'
  opponentType?: string;
  opponentElo?: number | null;
  openingName?: string | null;
  openingEco?: string | null;
}

/** Normalize a color from the game store ('w'/'b') to the stored form. */
export function normalizeColor(color: string): 'white' | 'black' {
  return color === 'b' || color === 'black' ? 'black' : 'white';
}

/** Derive the player's result from the game result and their color. */
export function deriveOutcome(result: string, playerColor: string): GameOutcome {
  const color = normalizeColor(playerColor);
  if (result === '1/2-1/2') return 'draw';
  if (result === '1-0') return color === 'white' ? 'win' : 'loss';
  if (result === '0-1') return color === 'black' ? 'win' : 'loss';
  return 'unknown';
}
