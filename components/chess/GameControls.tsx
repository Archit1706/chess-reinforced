'use client';

import React from 'react';
import {
  SkipBack,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  RotateCcw,
  RotateCw,
  FlipVertical,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useGameStore } from '@/store/game-store';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  className?: string;
  showNavigationControls?: boolean;
  showUndoRedo?: boolean;
  showFlipBoard?: boolean;
  showNewGame?: boolean;
  showExportImport?: boolean;
  onExport?: () => void;
  onImport?: () => void;
}

/**
 * Game control buttons for navigation, undo/redo, and other actions
 */
export function GameControls({
  className,
  showNavigationControls = true,
  showUndoRedo = true,
  showFlipBoard = true,
  showNewGame = true,
  showExportImport = false,
  onExport,
  onImport,
}: GameControlsProps) {
  const {
    history,
    historyIndex,
    undo,
    redo,
    goToMove,
    flipBoard,
    newGame,
    isGameOver,
  } = useGameStore();

  const canGoBack = history.length > 0 && (historyIndex === -1 ? true : historyIndex > 0);
  const canGoForward =
    historyIndex !== -1 && historyIndex < history.length - 1;

  // Navigation handlers
  const goToStart = () => goToMove(0);
  const goToEnd = () => goToMove(-1);
  const goBack = () => {
    if (historyIndex === -1) {
      goToMove(history.length - 2);
    } else if (historyIndex > 0) {
      goToMove(historyIndex - 1);
    }
  };
  const goForward = () => {
    if (historyIndex !== -1 && historyIndex < history.length - 1) {
      goToMove(historyIndex + 1);
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        {/* Navigation controls */}
        {showNavigationControls && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToStart}
                  disabled={!canGoBack}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Go to start</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goBack}
                  disabled={!canGoBack}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous move (←)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goForward}
                  disabled={!canGoForward}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next move (→)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToEnd}
                  disabled={!canGoForward}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Go to end</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Undo/Redo */}
        {showUndoRedo && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={undo}
                  disabled={history.length === 0}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={redo}
                  disabled={historyIndex === -1}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}

        {/* Flip board */}
        {showFlipBoard && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={flipBoard}>
                <FlipVertical className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Flip board (F)</TooltipContent>
          </Tooltip>
        )}

        {/* New game */}
        {showNewGame && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => newGame()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New game (N)</TooltipContent>
          </Tooltip>
        )}

        {/* Export/Import */}
        {showExportImport && (
          <>
            <div className="w-px h-6 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onExport}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export PGN</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onImport}>
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Import PGN</TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
