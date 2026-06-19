/**
 * Shared puzzle types.
 *
 * `NormalizedPuzzle` is the canonical internal shape used everywhere in the app
 * (DB rows, API responses, client board). It is "solver-first": `fen` is the
 * position with the solver to move, and `moves[0]` is the solver's first move.
 *
 * This differs from the raw Lichess database format, where the FEN is the
 * position *before* the opponent's setup move and `moves[0]` is that setup
 * move. The setup move is applied during import (see `lib/puzzles/lichess.ts`)
 * so that the rest of the stack never has to worry about the offset.
 */

export interface NormalizedPuzzle {
  /** Stable id (the Lichess PuzzleId for imported puzzles). */
  id: string;
  /** Position with the solver to move. */
  fen: string;
  /** Solution in UCI, solver-first (solver, opponent, solver, ...). */
  moves: string[];
  /** Difficulty rating. */
  rating: number;
  /** Tactical themes, e.g. ["fork", "endgame"]. */
  themes: string[];
}

/** What the client receives from the puzzle API. */
export type PuzzleDTO = NormalizedPuzzle;

/** Filters accepted by the random-puzzle endpoint. */
export interface PuzzleQuery {
  minRating?: number;
  maxRating?: number;
  /** Single Lichess theme token, e.g. "fork". */
  theme?: string;
  /** Ids to avoid returning (e.g. already seen this session). */
  exclude?: string[];
}
