'use client';

import React, { useRef, useEffect } from 'react';
import { useGameStore } from '@/store/game-store';
import { cn } from '@/lib/utils';

interface MoveHistoryProps {
  className?: string;
  maxHeight?: string;
}

/**
 * Move history component showing all moves in algebraic notation
 * Supports clicking on moves to navigate through the game
 */
export function MoveHistory({ className, maxHeight = '300px' }: MoveHistoryProps) {
  const { history, historyIndex, goToMove } = useGameStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest move
  useEffect(() => {
    if (containerRef.current && historyIndex === -1) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length, historyIndex]);

  // Group moves into pairs (white + black)
  const movePairs = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
      whiteIndex: i,
      blackIndex: i + 1,
    });
  }

  // Calculate the actual history position for comparison
  const currentIndex = historyIndex === -1 ? history.length - 1 : historyIndex;

  if (history.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground text-sm', className)}>
        No moves yet. Make a move to start!
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-y-auto font-mono text-sm',
        className
      )}
      style={{ maxHeight }}
    >
      <table className="w-full">
        <tbody>
          {movePairs.map((pair) => (
            <tr key={pair.moveNumber} className="hover:bg-muted/50">
              {/* Move number */}
              <td className="w-8 pr-2 text-right text-muted-foreground">
                {pair.moveNumber}.
              </td>

              {/* White's move */}
              <td className="w-1/2 px-2">
                <button
                  onClick={() => goToMove(pair.whiteIndex)}
                  className={cn(
                    'w-full text-left px-2 py-0.5 rounded transition-colors',
                    currentIndex === pair.whiteIndex
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-muted'
                  )}
                >
                  {pair.white?.san}
                </button>
              </td>

              {/* Black's move */}
              <td className="w-1/2 px-2">
                {pair.black && (
                  <button
                    onClick={() => goToMove(pair.blackIndex)}
                    className={cn(
                      'w-full text-left px-2 py-0.5 rounded transition-colors',
                      currentIndex === pair.blackIndex
                        ? 'bg-primary-600 text-white'
                        : 'hover:bg-muted'
                    )}
                  >
                    {pair.black.san}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
