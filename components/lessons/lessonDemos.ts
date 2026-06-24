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
  'rook-movement': {
    mode: 'interactive',
    fen: '4k3/8/8/3R4/8/8/8/4K3 w - - 0 1',
    caption: 'Drag the rook — it travels in straight lines along ranks and files.',
  },
  'queen-movement': {
    mode: 'interactive',
    fen: '4k3/8/8/3Q4/8/8/8/4K3 w - - 0 1',
    caption: 'Drag the queen — it combines the rook and bishop, the most powerful piece.',
  },
  'king-movement': {
    mode: 'interactive',
    fen: '4k3/8/8/3K4/8/8/8/8 w - - 0 1',
    caption: 'Drag the king — one square in any direction, and never into check.',
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
  skewers: {
    mode: 'animate',
    fen: '1q6/8/8/1k6/8/8/6K1/7R w - - 0 1',
    moves: ['Rb1+', 'Kc5', 'Rxb8'],
    caption: 'A skewer: the rook checks the king, and when it steps aside, the queen behind falls.',
    autoPlay: true,
  },
  'discovered-attacks': {
    mode: 'animate',
    fen: '3q2k1/5n2/8/3B4/8/8/8/3R2K1 w - - 0 1',
    moves: ['Bxf7+', 'Kxf7', 'Rxd8'],
    caption: 'Bxf7+ is a discovered check from the rook — after the king takes, Rxd8 wins the queen.',
    autoPlay: true,
  },
  'two-rook-mate': {
    mode: 'animate',
    fen: '4k3/8/8/8/8/8/R7/1R5K w - - 0 1',
    moves: ['Ra7', 'Kd8', 'Rb8#'],
    caption: 'The ladder mate: one rook cuts off a rank while the other drives the king back.',
    autoPlay: true,
  },
  'queen-king-mate': {
    mode: 'animate',
    fen: '4k3/8/3K4/8/8/8/8/4Q3 w - - 0 1',
    moves: ['Qe7#'],
    caption: 'The king guards e7 so the queen can deliver mate — never the queen alone.',
    autoPlay: true,
  },
  'smothered-mate': {
    mode: 'animate',
    fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1',
    moves: ['Nf7#'],
    caption: 'Smothered mate: the king is boxed in by its own pieces and the knight strikes.',
    autoPlay: true,
  },
  'develop-pieces': {
    mode: 'animate',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O', 'Nf6'],
    caption: 'Knights before bishops, then castle — a model opening development.',
    autoPlay: true,
  },
  'king-safety': {
    mode: 'animate',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'O-O'],
    caption: 'Castling tucks the king to safety and brings a rook toward the center.',
    autoPlay: true,
  },
  'ruy-lopez': {
    mode: 'animate',
    moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O'],
    caption: 'The Ruy Lopez: pressure the c6-knight, then castle and squeeze.',
    autoPlay: true,
  },
  'sicilian-defense': {
    mode: 'animate',
    moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3'],
    caption: 'The Open Sicilian: Black trades a wing pawn for a center pawn and active play.',
    autoPlay: true,
  },
  'queens-gambit': {
    mode: 'animate',
    moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3'],
    caption: "The Queen's Gambit Declined: Black supports d5 and develops solidly.",
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
