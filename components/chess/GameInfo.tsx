'use client';

import React from 'react';
import { useGameStore } from '@/store/game-store';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, Trophy, AlertTriangle, Flag } from 'lucide-react';

interface GameInfoProps {
  className?: string;
  showOpening?: boolean;
  showStatus?: boolean;
  showTurn?: boolean;
  playerWhite?: string;
  playerBlack?: string;
  whiteTime?: number;
  blackTime?: number;
}

/**
 * Displays game information including opening name, turn, and game status
 */
export function GameInfo({
  className,
  showOpening = true,
  showStatus = true,
  showTurn = true,
  playerWhite,
  playerBlack,
  whiteTime,
  blackTime,
}: GameInfoProps) {
  const {
    turn,
    isGameOver,
    isCheck,
    isCheckmate,
    isStalemate,
    isDraw,
    result,
    openingName,
    openingEco,
    config,
  } = useGameStore();

  // Format time display
  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine game status message
  const getStatusMessage = () => {
    if (isCheckmate) {
      return turn === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
    }
    if (isStalemate) return 'Draw by stalemate';
    if (isDraw) return 'Game drawn';
    if (isCheck) return `${turn === 'w' ? 'White' : 'Black'} is in check!`;
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <div className={cn('space-y-3', className)}>
      {/* Players */}
      {(playerWhite || playerBlack) && (
        <div className="space-y-2">
          {/* Black player (top when board is white orientation) */}
          {config.orientation === 'w' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-800 border border-gray-600" />
                <span className="font-medium">{playerBlack || 'Black'}</span>
              </div>
              {blackTime !== undefined && (
                <div className="flex items-center gap-1 text-sm font-mono">
                  <Clock className="h-3 w-3" />
                  {formatTime(blackTime)}
                </div>
              )}
            </div>
          )}

          {/* White player */}
          {config.orientation === 'b' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-white border border-gray-300" />
                <span className="font-medium">{playerWhite || 'White'}</span>
              </div>
              {whiteTime !== undefined && (
                <div className="flex items-center gap-1 text-sm font-mono">
                  <Clock className="h-3 w-3" />
                  {formatTime(whiteTime)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Opening name */}
      {showOpening && openingName && (
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="font-mono text-xs">
            {openingEco}
          </Badge>
          <span className="text-muted-foreground">{openingName}</span>
        </div>
      )}

      {/* Turn indicator */}
      {showTurn && !isGameOver && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-3 h-3 rounded-full',
              turn === 'w' ? 'bg-white border border-gray-300' : 'bg-gray-800'
            )}
          />
          <span className="text-sm">
            {turn === 'w' ? 'White' : 'Black'} to move
          </span>
        </div>
      )}

      {/* Game status */}
      {showStatus && statusMessage && (
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-md text-sm',
            isCheckmate
              ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
              : isCheck
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : isDraw
              ? 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
              : ''
          )}
        >
          {isCheckmate ? (
            <Trophy className="h-4 w-4" />
          ) : isCheck ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Flag className="h-4 w-4" />
          )}
          <span className="font-medium">{statusMessage}</span>
        </div>
      )}

      {/* Result */}
      {isGameOver && result && (
        <div className="text-center py-2">
          <Badge
            variant={
              result === '1-0'
                ? 'default'
                : result === '0-1'
                ? 'secondary'
                : 'outline'
            }
            className="text-lg px-4 py-1"
          >
            {result}
          </Badge>
        </div>
      )}
    </div>
  );
}
