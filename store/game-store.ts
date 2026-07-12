import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess, Square, Move } from 'chess.js';
import type { ChessColor, BoardConfig, GameResult } from '@/types/chess';
import { createGame, getGameState, makeMove, undoMove, detectOpening } from '@/lib/chess';
import { playSound } from '@/lib/sound';

/**
 * Main game state store using Zustand
 * Handles chess game logic, move history, and board configuration
 */

// Game mode types
export type GameMode = 'free' | 'vsComputer' | 'puzzle' | 'lesson' | 'analysis' | 'study';

interface GameState {
  // Chess.js instance (not persisted)
  game: Chess;

  // Game configuration
  mode: GameMode;
  playerColor: ChessColor;
  computerElo: number;

  // Board state
  fen: string;
  turn: ChessColor;
  isGameOver: boolean;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  result: GameResult | null;

  // Move history
  history: Move[];
  historyIndex: number; // Current position in history (-1 = latest)

  // UI state
  selectedSquare: Square | null;
  legalMoves: Square[];
  lastMove: { from: Square; to: Square } | null;
  premove: { from: Square; to: Square } | null;

  // Analysis state
  showAnalysis: boolean;
  evaluation: number | null;
  bestMove: string | null;

  // Opening detection
  openingName: string | null;
  openingEco: string | null;

  // Board configuration
  config: BoardConfig;
}

interface GameActions {
  // Game setup
  newGame: (fen?: string) => void;
  setMode: (mode: GameMode) => void;
  setPlayerColor: (color: ChessColor) => void;
  setComputerElo: (elo: number) => void;
  loadPgn: (pgn: string) => void;
  loadFen: (fen: string) => void;

  // Moves
  selectSquare: (square: Square | null) => void;
  movePiece: (from: Square, to: Square, promotion?: string, isEngineMove?: boolean) => boolean;
  undo: () => void;
  redo: () => void;
  goToMove: (index: number) => void;

  // Board config
  flipBoard: () => void;
  setOrientation: (color: ChessColor) => void;
  toggleCoordinates: () => void;
  toggleHighlightMoves: () => void;

  // Analysis
  setEvaluation: (evaluation: number | null) => void;
  setBestMove: (move: string | null) => void;
  toggleAnalysis: () => void;

  // Utility
  getPgn: () => string;
  getFen: () => string;
  reset: () => void;
}

const initialConfig: BoardConfig = {
  orientation: 'w',
  showCoordinates: true,
  highlightMoves: true,
  animationDuration: 200,
};

const createInitialState = (): Omit<GameState, 'game'> => ({
  mode: 'free',
  playerColor: 'w',
  // New players start against the gentlest opponent ("Beginner", 800) so a first
  // game isn't a blowout; the difficulty selector is one click away. Returning
  // users keep their own choice (computerElo is persisted).
  computerElo: 800,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  turn: 'w',
  isGameOver: false,
  isCheck: false,
  isCheckmate: false,
  isStalemate: false,
  isDraw: false,
  result: null,
  history: [],
  historyIndex: -1,
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  premove: null,
  showAnalysis: false,
  evaluation: null,
  bestMove: null,
  openingName: null,
  openingEco: null,
  config: initialConfig,
});

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      game: new Chess(),

      // === Game Setup ===

      newGame: (fen?: string) => {
        const game = createGame(fen);
        const state = getGameState(game);

        set({
          game,
          fen: state.fen,
          turn: state.turn,
          isGameOver: false,
          isCheck: false,
          isCheckmate: false,
          isStalemate: false,
          isDraw: false,
          result: null,
          history: [],
          historyIndex: -1,
          selectedSquare: null,
          legalMoves: [],
          lastMove: null,
          premove: null,
          evaluation: null,
          bestMove: null,
          openingName: null,
          openingEco: null,
        });
      },

      setMode: (mode) => set({ mode }),

      setPlayerColor: (color) => {
        set({
          playerColor: color,
          config: { ...get().config, orientation: color },
        });
      },

      setComputerElo: (elo) => set({ computerElo: elo }),

      loadPgn: (pgn) => {
        const game = new Chess();
        try {
          game.loadPgn(pgn);
          const state = getGameState(game);
          const opening = detectOpening(game);

          set({
            game,
            fen: state.fen,
            turn: state.turn,
            history: state.history,
            historyIndex: -1,
            isGameOver: state.isGameOver,
            isCheck: state.isCheck,
            isCheckmate: state.isCheckmate,
            isStalemate: state.isStalemate,
            isDraw: state.isDraw,
            result: state.result || null,
            lastMove:
              state.history.length > 0
                ? {
                    from: state.history[state.history.length - 1].from,
                    to: state.history[state.history.length - 1].to,
                  }
                : null,
            openingName: opening?.name || null,
            openingEco: opening?.eco || null,
          });
        } catch (e) {
          console.error('Failed to load PGN:', e);
        }
      },

      loadFen: (fen) => {
        try {
          const game = new Chess(fen);
          const state = getGameState(game);

          set({
            game,
            fen: state.fen,
            turn: state.turn,
            history: [],
            historyIndex: -1,
            isGameOver: state.isGameOver,
            isCheck: state.isCheck,
            isCheckmate: state.isCheckmate,
            isStalemate: state.isStalemate,
            isDraw: state.isDraw,
            result: state.result || null,
            lastMove: null,
            selectedSquare: null,
            legalMoves: [],
          });
        } catch (e) {
          console.error('Failed to load FEN:', e);
        }
      },

      // === Moves ===

      selectSquare: (square) => {
        const { game, turn, playerColor, mode, selectedSquare } = get();

        if (!square) {
          set({ selectedSquare: null, legalMoves: [] });
          return;
        }

        // If there's already a selected square, try to move
        if (selectedSquare) {
          const success = get().movePiece(selectedSquare, square);
          if (success) return;
        }

        // Select the square if it has a piece of the correct color
        const piece = game.get(square);
        if (piece && piece.color === turn) {
          // In vsComputer mode, only allow selecting player's pieces
          if (mode === 'vsComputer' && piece.color !== playerColor) {
            return;
          }

          const moves = game.moves({ square, verbose: true });
          set({
            selectedSquare: square,
            legalMoves: moves.map((m) => m.to),
          });
        } else {
          set({ selectedSquare: null, legalMoves: [] });
        }
      },

      movePiece: (from, to, promotion = 'q', isEngineMove = false) => {
        const { game, mode, playerColor, turn } = get();

        // In vsComputer mode, reject the human's input on the computer's turn —
        // but let engine-issued moves through (they're the computer's move).
        if (!isEngineMove && mode === 'vsComputer' && turn !== playerColor) {
          return false;
        }

        const move = makeMove(game, from, to, promotion as any);
        if (!move) return false;

        const state = getGameState(game);
        const opening = detectOpening(game);

        playSound(
          state.isGameOver
            ? 'gameEnd'
            : state.isCheck
            ? 'check'
            : move.captured
            ? 'capture'
            : 'move'
        );

        set({
          fen: state.fen,
          turn: state.turn,
          history: state.history,
          historyIndex: -1,
          isGameOver: state.isGameOver,
          isCheck: state.isCheck,
          isCheckmate: state.isCheckmate,
          isStalemate: state.isStalemate,
          isDraw: state.isDraw,
          result: state.result || null,
          selectedSquare: null,
          legalMoves: [],
          lastMove: { from, to },
          openingName: opening?.name || get().openingName,
          openingEco: opening?.eco || get().openingEco,
          // Keep the previous evaluation until fresh analysis arrives — nulling
          // it here made the eval bar snap to 0.0 on every single move.
          bestMove: null,
        });

        return true;
      },

      undo: () => {
        const { game, historyIndex, mode, playerColor } = get();

        // If we're viewing history, go back one move
        if (historyIndex !== -1) {
          get().goToMove(historyIndex - 1);
          return;
        }

        // Undo the last move
        const move = undoMove(game);
        if (!move) return;

        // In vsComputer mode, take back the whole move pair so it's the
        // player's turn again — undoing a single ply would leave the engine
        // to move, and it would immediately replay a reply, making undo a
        // no-op from the player's perspective.
        if (mode === 'vsComputer' && game.turn() !== playerColor) {
          undoMove(game);
        }

        const state = getGameState(game);

        set({
          fen: state.fen,
          turn: state.turn,
          history: state.history,
          isGameOver: state.isGameOver,
          isCheck: state.isCheck,
          isCheckmate: state.isCheckmate,
          isStalemate: state.isStalemate,
          isDraw: state.isDraw,
          result: state.result || null,
          lastMove:
            state.history.length > 0
              ? {
                  from: state.history[state.history.length - 1].from,
                  to: state.history[state.history.length - 1].to,
                }
              : null,
          selectedSquare: null,
          legalMoves: [],
        });
      },

      redo: () => {
        const { historyIndex, history } = get();
        if (historyIndex === -1 || historyIndex >= history.length - 1) return;
        get().goToMove(historyIndex + 1);
      },

      goToMove: (index) => {
        const { history, game: originalGame } = get();

        // Create a new game and replay moves up to the index
        const game = new Chess();
        const movesToReplay = index === -1 ? history : history.slice(0, index + 1);

        for (const move of movesToReplay) {
          game.move(move);
        }

        const state = getGameState(game);

        set({
          game,
          fen: state.fen,
          turn: state.turn,
          historyIndex: index,
          isCheck: state.isCheck,
          lastMove:
            movesToReplay.length > 0
              ? {
                  from: movesToReplay[movesToReplay.length - 1].from,
                  to: movesToReplay[movesToReplay.length - 1].to,
                }
              : null,
          selectedSquare: null,
          legalMoves: [],
        });
      },

      // === Board Config ===

      flipBoard: () => {
        set((state) => ({
          config: {
            ...state.config,
            orientation: state.config.orientation === 'w' ? 'b' : 'w',
          },
        }));
      },

      setOrientation: (color) => {
        set((state) => ({
          config: { ...state.config, orientation: color },
        }));
      },

      toggleCoordinates: () => {
        set((state) => ({
          config: { ...state.config, showCoordinates: !state.config.showCoordinates },
        }));
      },

      toggleHighlightMoves: () => {
        set((state) => ({
          config: { ...state.config, highlightMoves: !state.config.highlightMoves },
        }));
      },

      // === Analysis ===

      setEvaluation: (evaluation) => set({ evaluation }),

      setBestMove: (move) => set({ bestMove: move }),

      toggleAnalysis: () => set((state) => ({ showAnalysis: !state.showAnalysis })),

      // === Utility ===

      getPgn: () => get().game.pgn(),

      getFen: () => get().game.fen(),

      reset: () => {
        set({
          ...createInitialState(),
          game: new Chess(),
        });
      },
    }),
    {
      name: 'chess-game-storage',
      partialize: (state) => ({
        // Only persist configuration, not game state
        config: state.config,
        computerElo: state.computerElo,
        playerColor: state.playerColor,
      }),
    }
  )
);
