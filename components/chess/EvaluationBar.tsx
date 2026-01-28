'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { evalToPercentage, formatEvaluation } from '@/lib/chess';

interface EvaluationBarProps {
  evaluation: number; // Centipawns
  mate?: number; // Mate in N moves
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * Visual evaluation bar showing the current position's assessment
 * Positive values favor white, negative favor black
 */
export function EvaluationBar({
  evaluation,
  mate,
  orientation = 'vertical',
  className,
}: EvaluationBarProps) {
  // Calculate the percentage for the white portion
  const whitePercentage = evalToPercentage(evaluation, mate);
  const evalText = formatEvaluation(evaluation, mate);

  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center gap-2">
          <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className="absolute inset-y-0 left-0 bg-white transition-all duration-300"
              style={{ width: `${whitePercentage}%` }}
            />
          </div>
          <span className="w-12 text-right text-sm font-mono">{evalText}</span>
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={cn('w-6 h-full flex flex-col items-center', className)}>
      {/* Evaluation text at top */}
      <span className="text-xs font-mono mb-1 text-center">
        {whitePercentage >= 50 ? evalText : ''}
      </span>

      {/* The bar itself */}
      <div className="relative flex-1 w-full overflow-hidden rounded bg-gray-800">
        {/* White portion (fills from bottom) */}
        <div
          className="absolute inset-x-0 bottom-0 bg-white transition-all duration-300"
          style={{ height: `${whitePercentage}%` }}
        />
      </div>

      {/* Evaluation text at bottom */}
      <span className="text-xs font-mono mt-1 text-center">
        {whitePercentage < 50 ? evalText : ''}
      </span>
    </div>
  );
}
