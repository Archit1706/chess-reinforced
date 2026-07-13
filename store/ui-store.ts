import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI state store for theme, settings, and global UI state
 */

export type Theme = 'light' | 'dark' | 'system';

export type BoardTheme = 'classic' | 'wood' | 'blue' | 'green';

export type PieceSet = 'standard' | 'neo' | 'alpha' | 'merida';

interface UIState {
  // Theme settings
  theme: Theme;
  boardTheme: BoardTheme;
  pieceSet: PieceSet;

  // Sound settings
  soundEnabled: boolean;
  volume: number;

  // Board preferences
  showCoordinates: boolean;
  showLegalMoves: boolean;
  highlightLastMove: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast' | 'none';

  // UI state
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  showKeyboardShortcuts: boolean;

  // Analysis settings
  autoAnalyze: boolean;
  showEvaluation: boolean;
  analysisDepth: number;

  // Opponent personality — in-game banter/coaching from the computer.
  opponentBanter: boolean;
}

interface UIActions {
  // Theme
  setTheme: (theme: Theme) => void;
  setBoardTheme: (theme: BoardTheme) => void;
  setPieceSet: (set: PieceSet) => void;

  // Sound
  toggleSound: () => void;
  setVolume: (volume: number) => void;

  // Board
  toggleCoordinates: () => void;
  toggleLegalMoves: () => void;
  toggleHighlightLastMove: () => void;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast' | 'none') => void;

  // UI
  toggleSidebar: () => void;
  toggleSettings: () => void;
  toggleKeyboardShortcuts: () => void;

  // Analysis
  toggleAutoAnalyze: () => void;
  toggleEvaluation: () => void;
  setAnalysisDepth: (depth: number) => void;

  // Opponent
  toggleOpponentBanter: () => void;

  // Restore every preference to its default value.
  resetSettings: () => void;
}

const defaultState: UIState = {
  theme: 'system',
  boardTheme: 'classic',
  pieceSet: 'standard',
  soundEnabled: true,
  volume: 0.5,
  showCoordinates: true,
  showLegalMoves: true,
  highlightLastMove: true,
  animationSpeed: 'normal',
  isSidebarOpen: true,
  isSettingsOpen: false,
  showKeyboardShortcuts: false,
  autoAnalyze: false,
  showEvaluation: true,
  analysisDepth: 15,
  opponentBanter: true,
};

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      // Initial state
      ...defaultState,

      // Theme actions
      setTheme: (theme) => set({ theme }),
      setBoardTheme: (boardTheme) => set({ boardTheme }),
      setPieceSet: (pieceSet) => set({ pieceSet }),

      // Sound actions
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      setVolume: (volume) => set({ volume }),

      // Board actions
      toggleCoordinates: () =>
        set((state) => ({ showCoordinates: !state.showCoordinates })),
      toggleLegalMoves: () =>
        set((state) => ({ showLegalMoves: !state.showLegalMoves })),
      toggleHighlightLastMove: () =>
        set((state) => ({ highlightLastMove: !state.highlightLastMove })),
      setAnimationSpeed: (animationSpeed) => set({ animationSpeed }),

      // UI actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      toggleSettings: () =>
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
      toggleKeyboardShortcuts: () =>
        set((state) => ({ showKeyboardShortcuts: !state.showKeyboardShortcuts })),

      // Analysis actions
      toggleAutoAnalyze: () =>
        set((state) => ({ autoAnalyze: !state.autoAnalyze })),
      toggleEvaluation: () =>
        set((state) => ({ showEvaluation: !state.showEvaluation })),
      setAnalysisDepth: (analysisDepth) => set({ analysisDepth }),

      // Opponent actions
      toggleOpponentBanter: () =>
        set((state) => ({ opponentBanter: !state.opponentBanter })),

      // Reset
      resetSettings: () => set(defaultState),
    }),
    {
      name: 'chess-ui-storage',
    }
  )
);
