/**
 * Lichess puzzle database adapter.
 *
 * Parses rows of the open Lichess puzzle dump (CC0):
 *   https://database.lichess.org/#puzzles
 *
 * CSV columns:
 *   PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags
 *
 * In the raw format the FEN is the position *before* the opponent's setup move,
 * and Moves[0] is that setup move. We apply it here with chess.js and emit a
 * "solver-first" NormalizedPuzzle so the rest of the app stays simple.
 *
 * Every function is pure and total: malformed input yields `null` (never
 * throws), so a single bad row can't abort a multi-million-row import.
 */

import { Chess } from 'chess.js';
import type { NormalizedPuzzle } from './types';

export const LICHESS_CSV_HEADER =
  'PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl,OpeningTags';

const UCI_RE = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

/** True for the dump's header line (so callers can skip it). */
export function isHeaderRow(line: string): boolean {
  return line.startsWith('PuzzleId,');
}

/**
 * Parse and normalize a single Lichess CSV row.
 * Returns `null` for blank lines, the header, or any structurally invalid row.
 */
export function parseLichessCsvRow(line: string): NormalizedPuzzle | null {
  const trimmed = line.trim();
  if (!trimmed || isHeaderRow(trimmed)) return null;

  // The dump is comma-separated with no quoted fields, so a plain split is safe.
  const cols = trimmed.split(',');
  if (cols.length < 8) return null;

  const [id, fen, movesRaw, ratingRaw, , , , themesRaw] = cols;
  if (!id || !fen || !movesRaw) return null;

  const rawMoves = movesRaw.trim().split(/\s+/).filter(Boolean);
  // Need at least the opponent setup move plus one solver move.
  if (rawMoves.length < 2) return null;
  if (!rawMoves.every((m) => UCI_RE.test(m))) return null;

  const rating = Number.parseInt(ratingRaw, 10);
  if (!Number.isFinite(rating)) return null;

  // Apply the opponent's setup move to reach the solver-to-move position.
  let solverFen: string;
  try {
    const game = new Chess(fen);
    const setup = rawMoves[0];
    const applied = game.move({
      from: setup.slice(0, 2),
      to: setup.slice(2, 4),
      promotion: setup.length > 4 ? setup[4] : undefined,
    });
    if (!applied) return null;
    solverFen = game.fen();
  } catch {
    return null;
  }

  return {
    id,
    fen: solverFen,
    moves: rawMoves.slice(1),
    rating,
    themes: parseThemes(themesRaw),
  };
}

/** Lichess stores themes space-separated; we keep them as a clean token array. */
export function parseThemes(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.trim().split(/\s+/).filter(Boolean);
}

/** Persist themes as a comma-separated string (matches the Prisma schema). */
export function serializeThemes(themes: string[]): string {
  return themes.join(',');
}

/** Read a comma-separated theme string back into tokens. */
export function deserializeThemes(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

/** camelCase Lichess token -> human label, e.g. "backRankMate" -> "Back Rank Mate". */
export function formatTheme(theme: string): string {
  const spaced = theme.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
