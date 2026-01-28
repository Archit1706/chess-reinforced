import type { Chess, Square, Move, PieceSymbol, Color } from 'chess.js';

// Chess game types
export type ChessColor = Color;
export type ChessPiece = PieceSymbol;
export type ChessSquare = Square;
export type ChessMove = Move;

// Game state
export interface GameState {
  fen: string;
  turn: ChessColor;
  history: ChessMove[];
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  result?: GameResult;
}

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | '*';

// Board configuration
export interface BoardConfig {
  orientation: ChessColor;
  showCoordinates: boolean;
  highlightMoves: boolean;
  animationDuration: number;
}

// Move validation
export interface ValidMove {
  from: ChessSquare;
  to: ChessSquare;
  promotion?: ChessPiece;
}

// Arrow and highlight for board annotations
export interface BoardArrow {
  from: ChessSquare;
  to: ChessSquare;
  color?: string;
}

export interface BoardHighlight {
  square: ChessSquare;
  color?: string;
}

// Analysis from Stockfish
export interface MoveAnalysis {
  move: string;
  evaluation: number; // Centipawns (positive = white advantage)
  depth: number;
  pv: string[]; // Principal variation
  mate?: number; // Moves to mate (null if not mate)
}

export interface PositionAnalysis {
  fen: string;
  evaluation: number;
  bestMove: string;
  depth: number;
  pv: string[];
  mate?: number;
  topMoves: MoveAnalysis[];
}

// Game analysis result
export interface GameAnalysis {
  moves: AnalyzedMove[];
  averageCentipawnLoss: {
    white: number;
    black: number;
  };
  accuracy: {
    white: number;
    black: number;
  };
  mistakes: number;
  blunders: number;
  inaccuracies: number;
}

export interface AnalyzedMove {
  move: ChessMove;
  fen: string;
  evaluation: number;
  bestMove?: string;
  classification: MoveClassification;
  centipawnLoss: number;
}

export type MoveClassification =
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'book';

// Stockfish settings
export interface StockfishSettings {
  elo: number; // 800-3000
  depth: number; // Analysis depth
  multiPv: number; // Number of lines to analyze
  threads: number;
  hashSize: number; // MB
}

// Opening information
export interface Opening {
  eco: string;
  name: string;
  moves: string;
  fen?: string;
}

// PGN metadata
export interface PGNHeaders {
  Event?: string;
  Site?: string;
  Date?: string;
  Round?: string;
  White?: string;
  Black?: string;
  Result?: string;
  WhiteElo?: string;
  BlackElo?: string;
  ECO?: string;
  Opening?: string;
  TimeControl?: string;
  Termination?: string;
}
