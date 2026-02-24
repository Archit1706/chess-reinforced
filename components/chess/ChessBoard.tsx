'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Chessboard, PromotionPieceOption } from 'react-chessboard';
import { Square, PieceSymbol } from 'chess.js';
import { useGameStore } from '@/store/game-store';
import { useUIStore } from '@/store/ui-store';
import { cn } from '@/lib/utils';

// Helper to extract piece symbol from promotion option (e.g., "wQ" -> "q")
function extractPieceSymbol(promotionPiece: PromotionPieceOption): PieceSymbol {
  return promotionPiece[1].toLowerCase() as PieceSymbol;
}

interface ChessBoardProps {
  className?: string;
  boardWidth?: number;
  interactive?: boolean;
  customFen?: string;
  customArrows?: [Square, Square, string?][];
  customSquareStyles?: Record<string, React.CSSProperties>;
  onMove?: (from: Square, to: Square, promotion?: PieceSymbol) => boolean;
}

/**
 * Main chess board component using react-chessboard
 * Handles piece movement, highlighting, and visual feedback
 */
export function ChessBoard({
  className,
  boardWidth,
  interactive = true,
  customFen,
  customArrows,
  customSquareStyles,
  onMove,
}: ChessBoardProps) {
  const {
    fen,
    selectedSquare,
    legalMoves,
    lastMove,
    config,
    selectSquare,
    movePiece,
    isGameOver,
  } = useGameStore();

  const { showLegalMoves, highlightLastMove, animationSpeed } = useUIStore();

  // Promotion dialog state
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Calculate animation duration
  const animationDuration = useMemo(() => {
    switch (animationSpeed) {
      case 'slow':
        return 300;
      case 'normal':
        return 200;
      case 'fast':
        return 100;
      case 'none':
        return 0;
    }
  }, [animationSpeed]);

  // Generate square styles for highlighting
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Custom styles take precedence
    if (customSquareStyles) {
      Object.assign(styles, customSquareStyles);
    }

    // Highlight last move
    if (highlightLastMove && lastMove) {
      styles[lastMove.from] = {
        ...styles[lastMove.from],
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      };
      styles[lastMove.to] = {
        ...styles[lastMove.to],
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      };
    }

    // Highlight selected square
    if (selectedSquare) {
      styles[selectedSquare] = {
        ...styles[selectedSquare],
        backgroundColor: 'rgba(186, 202, 68, 0.6)',
      };
    }

    // Show legal moves
    if (showLegalMoves && selectedSquare && legalMoves.length > 0) {
      legalMoves.forEach((square) => {
        styles[square] = {
          ...styles[square],
          background:
            'radial-gradient(circle, rgba(130, 151, 105, 0.6) 25%, transparent 25%)',
          borderRadius: '50%',
        };
      });
    }

    return styles;
  }, [
    customSquareStyles,
    highlightLastMove,
    lastMove,
    selectedSquare,
    showLegalMoves,
    legalMoves,
  ]);

  // Handle piece drag start
  const onPieceDragBegin = useCallback(
    (piece: string, sourceSquare: Square) => {
      if (!interactive || isGameOver) return false;
      selectSquare(sourceSquare);
      return true;
    },
    [interactive, isGameOver, selectSquare]
  );

  // Handle piece drop
  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square, piece: string) => {
      if (!interactive) return false;

      // Check for pawn promotion
      const isPawnPromotion =
        piece[1] === 'P' &&
        ((piece[0] === 'w' && targetSquare[1] === '8') ||
          (piece[0] === 'b' && targetSquare[1] === '1'));

      if (isPawnPromotion) {
        setPromotionSquare({ from: sourceSquare, to: targetSquare });
        setShowPromotion(true);
        return false;
      }

      // Use custom onMove handler if provided
      if (onMove) {
        return onMove(sourceSquare, targetSquare);
      }

      // Default: use store's movePiece
      return movePiece(sourceSquare, targetSquare);
    },
    [interactive, onMove, movePiece]
  );

  // Handle promotion selection
  // react-chessboard uses PromotionPieceOption like "wQ", "bR", etc.
  const onPromotionPieceSelect = useCallback(
    (piece?: PromotionPieceOption, promoteFromSquare?: Square, promoteToSquare?: Square) => {
      setShowPromotion(false);
      if (!piece) return false;

      // Use provided squares or fall back to stored promotion square
      const from = promoteFromSquare || promotionSquare?.from;
      const to = promoteToSquare || promotionSquare?.to;

      if (!from || !to) return false;

      setPromotionSquare(null);

      // Extract the piece symbol (e.g., "wQ" -> "q")
      const pieceSymbol = extractPieceSymbol(piece);

      if (onMove) {
        return onMove(from, to, pieceSymbol);
      }
      return movePiece(from, to, pieceSymbol);
    },
    [promotionSquare, onMove, movePiece]
  );

  // Handle square click
  const onSquareClick = useCallback(
    (square: Square) => {
      if (!interactive || isGameOver) return;

      // If a square is already selected, try to move there
      if (selectedSquare && legalMoves.includes(square)) {
        const piece = useGameStore.getState().game.get(selectedSquare);
        const isPawnPromotion =
          piece?.type === 'p' &&
          ((piece.color === 'w' && square[1] === '8') ||
            (piece.color === 'b' && square[1] === '1'));

        if (isPawnPromotion) {
          setPromotionSquare({ from: selectedSquare, to: square });
          setShowPromotion(true);
          return;
        }

        if (onMove) {
          onMove(selectedSquare, square);
        } else {
          movePiece(selectedSquare, square);
        }
        return;
      }

      // Otherwise, select the clicked square
      selectSquare(square);
    },
    [interactive, isGameOver, selectedSquare, legalMoves, onMove, movePiece, selectSquare]
  );

  // Handle right click (for arrows in future)
  const onSquareRightClick = useCallback((square: Square) => {
    // Future: handle arrow drawing
  }, []);

  return (
    <div className={cn('relative', className)}>
      <Chessboard
        id="chess-board"
        position={customFen || fen}
        boardWidth={boardWidth || 560}
        boardOrientation={config.orientation === 'w' ? 'white' : 'black'}
        animationDuration={animationDuration}
        arePiecesDraggable={interactive && !isGameOver}
        onPieceDragBegin={onPieceDragBegin}
        onPieceDrop={onPieceDrop}
        onSquareClick={onSquareClick}
        onSquareRightClick={onSquareRightClick}
        onPromotionPieceSelect={onPromotionPieceSelect}
        showPromotionDialog={showPromotion}
        promotionToSquare={promotionSquare?.to}
        customSquareStyles={squareStyles}
        customArrows={customArrows}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
      />
    </div>
  );
}
