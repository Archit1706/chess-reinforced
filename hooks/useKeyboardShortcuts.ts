'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/game-store';
import { useUIStore } from '@/store/ui-store';

/**
 * Custom hook for keyboard shortcuts
 * Supports chess-specific navigation and global shortcuts
 */
export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    flipBoard,
    newGame,
    history,
    historyIndex,
    goToMove,
  } = useGameStore();

  const { toggleSettings, toggleKeyboardShortcuts, setTheme, theme } = useUIStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      // Navigation shortcuts
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
            newGame();
          }
          break;

        // Z - Undo (with Ctrl/Cmd)
        case 'z':
          if (ctrlOrCmd && !event.shiftKey) {
            event.preventDefault();
            undo();
          } else if (ctrlOrCmd && event.shiftKey) {
            // Ctrl+Shift+Z - Redo
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

        // Escape - Close modals
        case 'escape':
          // Handle by modals themselves
          break;

        // ? - Show keyboard shortcuts
        case '?':
          if (event.shiftKey) {
            event.preventDefault();
            toggleKeyboardShortcuts();
          }
          break;

        // S - Settings
        case 's':
          if (!ctrlOrCmd) {
            event.preventDefault();
            toggleSettings();
          }
          break;

        // T - Toggle theme
        case 't':
          if (!ctrlOrCmd) {
            event.preventDefault();
            setTheme(theme === 'dark' ? 'light' : 'dark');
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
    [
      undo,
      redo,
      flipBoard,
      newGame,
      goToMove,
      history,
      historyIndex,
      toggleSettings,
      toggleKeyboardShortcuts,
      setTheme,
      theme,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
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
  {
    category: 'General',
    shortcuts: [
      { key: 'T', description: 'Toggle theme' },
      { key: 'S', description: 'Open settings' },
      { key: 'Shift+?', description: 'Show shortcuts' },
      { key: 'Esc', description: 'Close modal' },
    ],
  },
];
