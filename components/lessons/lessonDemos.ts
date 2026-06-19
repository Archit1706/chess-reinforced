import { Chess } from 'chess.js';

/**
 * Curated, topic-matched board demos keyed by lesson slug. These live in the UI
 * layer (not the DB) so they appear without re-seeding. `animate` demos step
 * through a legal move sequence; `interactive` demos are drag-to-play sandboxes.
 */
export interface LessonDemo {
  mode: 'animate' | 'interactive';
  fen?: string;
  /** Legal SAN/UCI moves from `fen` (animate mode). */
  moves?: string[];
  caption: string;
  flip?: boolean;
  autoPlay?: boolean;
}

export const LESSON_DEMOS: Record<string, LessonDemo> = {
  'pawn-movement': {
    mode: 'animate',
    moves: ['e4', 'e5', 'd4', 'exd4', 'c3'],
    caption: 'Pawns advance one square (two from their start) and capture diagonally.',
    autoPlay: true,
  },
  'knight-movement': {
    mode: 'interactive',
    fen: '4k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
    caption: 'Drag the knight — it moves in an L-shape and is the only piece that jumps.',
  },
  'bishop-movement': {
    mode: 'interactive',
    fen: '4k3/8/8/3B4/8/8/8/4K3 w - - 0 1',
    caption: 'Drag the bishop — it slides any distance along the diagonals.',
  },
  'center-control': {
    mode: 'animate',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'],
    caption: 'Develop pieces toward the center to fight for the key central squares.',
    autoPlay: true,
  },
  'italian-game': {
    mode: 'animate',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4'],
    caption: 'The Italian Game: quick development followed by the central break d4.',
    autoPlay: true,
  },
  forks: {
    mode: 'animate',
    fen: '4q1k1/8/8/8/4N3/8/8/6K1 w - - 0 1',
    moves: ['Nf6+', 'Kh8', 'Nxe8'],
    caption: 'A fork hits two targets at once: Nf6+ checks the king and then wins the queen.',
    autoPlay: true,
  },
  pins: {
    mode: 'animate',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'],
    caption: 'A pin: the bishop on b5 pins the knight to the king, so it cannot move.',
    autoPlay: true,
  },
  'back-rank-mate': {
    mode: 'animate',
    fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
    moves: ['Ra8#'],
    caption: 'Trapped behind its own pawns, the king has no escape — Ra8 is checkmate.',
    autoPlay: true,
  },
  'king-pawn-endgame': {
    mode: 'animate',
    fen: '8/4P1k1/8/8/8/8/6K1/8 w - - 0 1',
    moves: ['e8=Q'],
    caption: 'Escort a pawn to the final rank and it promotes — almost always to a queen.',
    autoPlay: true,
  },
};

/** Expand a legal move sequence into FEN frames for animation. */
export function framesFromMoves(startFen: string | undefined, moves: string[]): string[] {
  const game = startFen ? new Chess(startFen) : new Chess();
  const frames = [game.fen()];
  for (const mv of moves) {
    let ok = false;
    try {
      ok = !!game.move(mv);
    } catch {
      ok = false;
    }
    if (!ok && mv.length >= 4) {
      try {
        ok = !!game.move({ from: mv.slice(0, 2), to: mv.slice(2, 4), promotion: mv[4] as never });
      } catch {
        ok = false;
      }
    }
    frames.push(game.fen());
  }
  return frames;
}
