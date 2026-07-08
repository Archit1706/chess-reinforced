'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';

interface KeyboardShortcutOptions {
  /**
   * Called for the "N" (new game) shortcut. Pages that have a new-game dialog
   * should pass an opener here so a stray keypress can't silently wipe a game
   * in progress; without it, N starts a new game directly.
   */
  onNewGame?: () => void;
  /**
   * Temporarily suspend all shortcuts — e.g. while a dialog with its own
   * keyboard handling (game review) is open, so arrows don't drive two boards.
   */
  disabled?: boolean;
}

/**
 * Global board/navigation keyboard shortcuts, bound to the game store.
 * Mount on pages where the store-backed board is the main content (play page).
 */
export function useKeyboardShortcuts({ onNewGame, disabled = false }: KeyboardShortcutOptions = {}) {
  const {
    undo,
    redo,
    flipBoard,
    newGame,
    history,
    historyIndex,
    goToMove,
  } = useGameStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts while typing or interacting with form controls.
      const target = event.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      switch (key) {
        // Arrow keys for move navigation
        case 'arrowleft':
          event.preventDefault();
          if (historyIndex === -1 && history.length > 0) {
            goToMove(history.length - 2);
          } else if (historyIndex > 0) {
            goToMove(historyIndex - 1);
          }
          break;

        case 'arrowright':
          event.preventDefault();
          if (historyIndex !== -1 && historyIndex < history.length - 1) {
            goToMove(historyIndex + 1);
          } else if (historyIndex !== -1) {
            goToMove(-1);
          }
          break;

        case 'arrowup':
          event.preventDefault();
          goToMove(0);
          break;

        case 'arrowdown':
          event.preventDefault();
          goToMove(-1);
          break;

        // F - Flip board
        case 'f':
          if (!ctrlOrCmd) {
            event.preventDefault();
            flipBoard();
          }
          break;

        // N - New game
        case 'n':
          if (!ctrlOrCmd) {
            event.preventDefault();
            if (onNewGame) onNewGame();
            else newGame();
          }
          break;

        // Z - Undo (with Ctrl/Cmd); Ctrl+Shift+Z - Redo
        case 'z':
          if (ctrlOrCmd && !event.shiftKey) {
            event.preventDefault();
            undo();
          } else if (ctrlOrCmd && event.shiftKey) {
            event.preventDefault();
            redo();
          }
          break;

        // Y - Redo (with Ctrl/Cmd)
        case 'y':
          if (ctrlOrCmd) {
            event.preventDefault();
            redo();
          }
          break;

        // Home - Go to start
        case 'home':
          event.preventDefault();
          goToMove(0);
          break;

        // End - Go to current position
        case 'end':
          event.preventDefault();
          goToMove(-1);
          break;
      }
    },
    [undo, redo, flipBoard, newGame, onNewGame, goToMove, history, historyIndex]
  );

  useEffect(() => {
    if (disabled) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, disabled]);
}

// List of all keyboard shortcuts for display
export const keyboardShortcuts = [
  {
    category: 'Navigation',
    shortcuts: [
      { key: '←', description: 'Previous move' },
      { key: '→', description: 'Next move' },
      { key: '↑', description: 'Go to start' },
      { key: '↓', description: 'Go to current position' },
      { key: 'Home', description: 'Go to start' },
      { key: 'End', description: 'Go to latest move' },
    ],
  },
  {
    category: 'Game Actions',
    shortcuts: [
      { key: 'F', description: 'Flip board' },
      { key: 'N', description: 'New game' },
      { key: 'Ctrl+Z', description: 'Undo move' },
      { key: 'Ctrl+Y', description: 'Redo move' },
    ],
  },
];
