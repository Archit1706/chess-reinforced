import { Chess, Square, Move, SQUARES, PieceSymbol } from 'chess.js';
import type {
  ChessMove,
  ChessSquare,
  GameState,
  GameResult,
  PGNHeaders,
  Opening,
} from '@/types/chess';

/**
 * Create a new Chess.js instance
 * Optionally initialize from FEN or PGN
 */
export function createGame(fenOrPgn?: string): Chess {
  const game = new Chess();
  if (fenOrPgn) {
    // Try to load as FEN first, then as PGN
    try {
      game.load(fenOrPgn);
    } catch {
      try {
        game.loadPgn(fenOrPgn);
      } catch {
        console.error('Failed to load position:', fenOrPgn);
      }
    }
  }
  return game;
}

/**
 * Get the current game state from a Chess instance
 */
export function getGameState(game: Chess): GameState {
  const history = game.history({ verbose: true });

  let result: GameResult | undefined;
  if (game.isCheckmate()) {
    result = game.turn() === 'w' ? '0-1' : '1-0';
  } else if (game.isDraw()) {
    result = '1/2-1/2';
  }

  return {
    fen: game.fen(),
    turn: game.turn(),
    history,
    isGameOver: game.isGameOver(),
    isCheck: game.isCheck(),
    isCheckmate: game.isCheckmate(),
    isStalemate: game.isStalemate(),
    isDraw: game.isDraw(),
    result,
  };
}

/**
 * Get all legal moves for a specific square
 */
export function getLegalMoves(game: Chess, square: Square): Move[] {
  return game.moves({ square, verbose: true });
}

/**
 * Get all legal destination squares for a piece on a given square
 */
export function getDestinationSquares(game: Chess, square: Square): Square[] {
  const moves = getLegalMoves(game, square);
  return moves.map((move) => move.to);
}

/**
 * Check if a move is legal
 */
export function isLegalMove(
  game: Chess,
  from: Square,
  to: Square,
  promotion?: PieceSymbol
): boolean {
  const moves = getLegalMoves(game, from);
  return moves.some(
    (move) =>
      move.to === to && (!promotion || move.promotion === promotion)
  );
}

/**
 * Make a move on the board
 * Returns the move object if successful, null if invalid
 */
export function makeMove(
  game: Chess,
  from: Square,
  to: Square,
  promotion?: PieceSymbol
): Move | null {
  try {
    const move = game.move({
      from,
      to,
      promotion: promotion || 'q', // Default to queen promotion
    });
    return move;
  } catch {
    return null;
  }
}

/**
 * Undo the last move
 * Returns the undone move, or null if no moves to undo
 */
export function undoMove(game: Chess): Move | null {
  return game.undo();
}

/**
 * Convert a move to algebraic notation (SAN)
 */
export function moveToSan(move: Move): string {
  return move.san;
}

/**
 * Convert a move to UCI notation (e.g., e2e4)
 */
export function moveToUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion || ''}`;
}

/**
 * Parse UCI move string into from/to squares
 */
export function parseUciMove(uci: string): { from: Square; to: Square; promotion?: PieceSymbol } {
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const promotion = uci.length > 4 ? (uci[4] as PieceSymbol) : undefined;
  return { from, to, promotion };
}

/**
 * Convert a UCI move to SAN for a given position (e.g., "g1f3" → "Nf3").
 * Returns null if the move is illegal in that position.
 */
/**
 * Turn an engine principal variation (a list of UCI moves) into a readable,
 * numbered SAN line by replaying it from `fen`. Returns the display text plus
 * the UCI moves that were actually legal (so callers can "play" exactly what's
 * shown). Capped at `maxPlies` so the line stays compact; appends "…" when the
 * variation was longer.
 */
export function buildPv(
  fen: string,
  pvUci: string[],
  maxPlies = 12
): { text: string; uci: string[] } {
  const game = new Chess();
  try {
    game.load(fen);
  } catch {
    return { text: '', uci: [] };
  }
  const parts: string[] = [];
  const used: string[] = [];
  const fields = fen.split(' ');
  let moveNo = parseInt(fields[5] || '1', 10) || 1;
  let whiteToMove = fields[1] !== 'b';
  for (let i = 0; i < pvUci.length && i < maxPlies; i++) {
    const uci = pvUci[i];
    if (!uci || uci.length < 4) break;
    let m: Move | null;
    try {
      m = game.move({
        from: uci.slice(0, 2) as Square,
        to: uci.slice(2, 4) as Square,
        promotion: (uci[4] as PieceSymbol) || undefined,
      });
    } catch {
      m = null;
    }
    if (!m) break;
    used.push(uci);
    if (whiteToMove) {
      parts.push(`${moveNo}.${m.san}`);
    } else {
      parts.push(parts.length === 0 ? `${moveNo}…${m.san}` : m.san);
      moveNo++;
    }
    whiteToMove = !whiteToMove;
  }
  const truncated = pvUci.length > used.length && used.length > 0;
  return { text: parts.join(' ') + (truncated ? ' …' : ''), uci: used };
}

export function uciToSan(fen: string, uci: string): string | null {
  try {
    const game = new Chess(fen);
    const { from, to, promotion } = parseUciMove(uci);
    const move = game.move({ from, to, promotion });
    return move?.san ?? null;
  } catch {
    return null;
  }
}

/**
 * Get piece on a square
 */
export function getPieceAt(game: Chess, square: Square) {
  return game.get(square);
}

/**
 * Check if a square has a piece of a given color
 */
export function hasPieceOfColor(game: Chess, square: Square, color: 'w' | 'b'): boolean {
  const piece = game.get(square);
  return !!piece && piece.color === color;
}

/**
 * Get all squares with pieces of a given color
 */
export function getSquaresWithPieces(game: Chess, color: 'w' | 'b'): Square[] {
  const squares: Square[] = [];
  for (const square of SQUARES) {
    const piece = game.get(square);
    if (piece && piece.color === color) {
      squares.push(square);
    }
  }
  return squares;
}

/**
 * Generate PGN string from game
 */
export function generatePgn(game: Chess, headers?: PGNHeaders): string {
  // Set headers if provided
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        game.header(key, value);
      }
    });
  }
  return game.pgn();
}

/**
 * Get move number from history index
 */
export function getMoveNumber(historyIndex: number): number {
  return Math.floor(historyIndex / 2) + 1;
}

/**
 * Format move for display (with move number)
 */
export function formatMoveWithNumber(move: Move, historyIndex: number): string {
  const moveNum = getMoveNumber(historyIndex);
  const isWhite = historyIndex % 2 === 0;
  if (isWhite) {
    return `${moveNum}. ${move.san}`;
  }
  return `${moveNum}... ${move.san}`;
}

/**
 * Detect the opening from the current position
 * This is a simplified version - a full implementation would use a database
 */
export function detectOpening(game: Chess): Opening | null {
  const pgn = game.pgn({ maxWidth: 5, newline: ' ' });
  const moves = pgn.replace(/\d+\.\s*/g, '').trim();

  // Common openings (simplified)
  const openings: Record<string, Opening> = {
    'e4': { eco: 'B00', name: "King's Pawn Opening", moves: 'e4' },
    'e4 e5': { eco: 'C20', name: 'Open Game', moves: 'e4 e5' },
    'e4 e5 Nf3': { eco: 'C40', name: "King's Knight Opening", moves: 'e4 e5 Nf3' },
    'e4 e5 Nf3 Nc6': { eco: 'C44', name: "King's Knight Game", moves: 'e4 e5 Nf3 Nc6' },
    'e4 e5 Nf3 Nc6 Bb5': { eco: 'C60', name: 'Ruy Lopez', moves: 'e4 e5 Nf3 Nc6 Bb5' },
    'e4 e5 Nf3 Nc6 Bc4': { eco: 'C50', name: 'Italian Game', moves: 'e4 e5 Nf3 Nc6 Bc4' },
    'e4 c5': { eco: 'B20', name: 'Sicilian Defense', moves: 'e4 c5' },
    'e4 c6': { eco: 'B10', name: 'Caro-Kann Defense', moves: 'e4 c6' },
    'e4 e6': { eco: 'C00', name: 'French Defense', moves: 'e4 e6' },
    'd4': { eco: 'A40', name: "Queen's Pawn Opening", moves: 'd4' },
    'd4 d5': { eco: 'D00', name: "Queen's Pawn Game", moves: 'd4 d5' },
    'd4 d5 c4': { eco: 'D06', name: "Queen's Gambit", moves: 'd4 d5 c4' },
    'd4 d5 c4 e6': { eco: 'D30', name: "Queen's Gambit Declined", moves: 'd4 d5 c4 e6' },
    'd4 d5 c4 dxc4': { eco: 'D20', name: "Queen's Gambit Accepted", moves: 'd4 d5 c4 dxc4' },
    'd4 Nf6': { eco: 'A45', name: 'Indian Defense', moves: 'd4 Nf6' },
    'd4 Nf6 c4': { eco: 'A50', name: 'Indian Game', moves: 'd4 Nf6 c4' },
    'd4 Nf6 c4 g6': { eco: 'E60', name: "King's Indian Defense", moves: 'd4 Nf6 c4 g6' },
    'Nf3': { eco: 'A04', name: 'Reti Opening', moves: 'Nf3' },
    'c4': { eco: 'A10', name: 'English Opening', moves: 'c4' },
  };

  // Find the longest matching opening
  let longestMatch: Opening | null = null;
  for (const [movesStr, opening] of Object.entries(openings)) {
    if (moves.startsWith(movesStr)) {
      if (!longestMatch || movesStr.length > longestMatch.moves.length) {
        longestMatch = opening;
      }
    }
  }

  return longestMatch;
}

/**
 * Get evaluation bar percentage from centipawn evaluation
 * Returns a value from 0-100 (50 = equal)
 */
export function evalToPercentage(evalCp: number, mateIn?: number): number {
  if (mateIn !== undefined) {
    return mateIn > 0 ? 100 : 0;
  }

  // Convert centipawns to a percentage using a sigmoid-like function
  // This ensures the bar doesn't get stuck at extremes
  const maxEval = 1000; // Cap at +/- 10 pawns
  const clampedEval = Math.max(-maxEval, Math.min(maxEval, evalCp));
  const percentage = 50 + (clampedEval / maxEval) * 50;

  return Math.round(percentage);
}

/**
 * Format evaluation for display
 */
export function formatEvaluation(evalCp: number, mateIn?: number): string {
  if (mateIn !== undefined) {
    return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
  }

  const pawns = evalCp / 100;
  const sign = pawns > 0 ? '+' : '';
  return `${sign}${pawns.toFixed(1)}`;
}

/**
 * Classify a move based on centipawn loss
 */
export function classifyMove(centipawnLoss: number): string {
  if (centipawnLoss <= 10) return 'best';
  if (centipawnLoss <= 25) return 'excellent';
  if (centipawnLoss <= 50) return 'good';
  if (centipawnLoss <= 100) return 'inaccuracy';
  if (centipawnLoss <= 200) return 'mistake';
  return 'blunder';
}

/**
 * Get color for move classification
 */
export function getMoveClassificationColor(classification: string): string {
  switch (classification) {
    case 'best':
      return '#96bc4b';
    case 'excellent':
      return '#96bc4b';
    case 'good':
      return '#96af8b';
    case 'inaccuracy':
      return '#f7c631';
    case 'mistake':
      return '#ffa459';
    case 'blunder':
      return '#fa412d';
    default:
      return '#888888';
  }
}
