'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess, Square, PieceSymbol } from 'chess.js';
import { useGameStore } from '@/store/game-store';
import { useUIStore } from '@/store/ui-store';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import { cn } from '@/lib/utils';

// react-chessboard uses promotion strings like "wQ" / "bR".
type PromotionPiece = 'wQ' | 'wR' | 'wB' | 'wN' | 'bQ' | 'bR' | 'bB' | 'bN';

function extractPieceSymbol(promotionPiece: PromotionPiece): PieceSymbol {
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
  /**
   * When provided, ChessBoard runs in **local mode**: selection / legal-move
   * highlights / last-move highlight are derived from THIS chess.js instance
   * instead of the global game store. Use for puzzles, viewers, mistake
   * trainers — anywhere the displayed position is decoupled from the play
   * page's game (otherwise you'd see the play-page's turn/selection bleeding
   * onto a puzzle position).
   */
  localGame?: Chess;
  /** Explicit board orientation override (defaults to global config). */
  boardOrientation?: 'w' | 'b' | 'white' | 'black';
}

/**
 * Main interactive chess board.
 * - Default: bound to the global game store (play page).
 * - With `localGame`: self-contained, uses its own selection state.
 */
export function ChessBoard({
  className,
  boardWidth,
  interactive = true,
  customFen,
  customArrows,
  customSquareStyles,
  onMove,
  localGame,
  boardOrientation,
}: ChessBoardProps) {
  const {
    fen: storeFen,
    selectedSquare: storeSelected,
    legalMoves: storeLegal,
    lastMove: storeLastMove,
    config,
    selectSquare: storeSelect,
    movePiece: storeMove,
    isGameOver: storeIsGameOver,
    game: storeGame,
  } = useGameStore();

  const { showLegalMoves, highlightLastMove, animationSpeed, showCoordinates } = useUIStore();

  const useLocal = !!localGame;

  // Local selection state — only used in local mode.
  const [localSelected, setLocalSelected] = useState<Square | null>(null);
  const [localLegal, setLocalLegal] = useState<Square[]>([]);
  const [localLastMove, setLocalLastMove] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Promotion dialog state.
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionSquare, setPromotionSquare] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Reset local selection whenever the displayed position changes (e.g., a new
  // puzzle is loaded, or the opponent's reply landed).
  useEffect(() => {
    if (useLocal) {
      setLocalSelected(null);
      setLocalLegal([]);
    }
  }, [useLocal, customFen]);

  // Reset local lastMove when a fresh puzzle starts (FEN matches localGame's
  // current FEN AND no move has been played yet against this instance).
  useEffect(() => {
    if (useLocal && localGame && customFen && localGame.history().length === 0) {
      setLocalLastMove(null);
    }
  }, [useLocal, localGame, customFen]);

  // Effective view of selection / legal moves / last move based on mode.
  const effectiveSelected = useLocal ? localSelected : storeSelected;
  const effectiveLegal = useLocal ? localLegal : storeLegal;
  const effectiveLastMove = useLocal ? localLastMove : storeLastMove;
  const effectiveIsGameOver = useLocal ? localGame!.isGameOver() : storeIsGameOver;

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

  // Generate square styles for highlighting.
  const squareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (customSquareStyles) Object.assign(styles, customSquareStyles);

    // Use the `background` shorthand everywhere (never `backgroundColor`):
    // mixing the two on a square whose highlight changes kind between renders
    // makes React warn about conflicting style properties and can flicker.
    if (highlightLastMove && effectiveLastMove) {
      styles[effectiveLastMove.from] = {
        ...styles[effectiveLastMove.from],
        background: 'rgba(255, 255, 0, 0.4)',
      };
      styles[effectiveLastMove.to] = {
        ...styles[effectiveLastMove.to],
        background: 'rgba(255, 255, 0, 0.4)',
      };
    }

    if (effectiveSelected) {
      styles[effectiveSelected] = {
        ...styles[effectiveSelected],
        background: 'rgba(186, 202, 68, 0.6)',
      };
    }

    if (showLegalMoves && effectiveSelected && effectiveLegal.length > 0) {
      effectiveLegal.forEach((square) => {
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
    effectiveLastMove,
    effectiveSelected,
    showLegalMoves,
    effectiveLegal,
  ]);

  /** Select a square in local mode — derives legal moves from `localGame`. */
  const selectLocalSquare = useCallback(
    (square: Square | null) => {
      if (!localGame) return;
      if (!square) {
        setLocalSelected(null);
        setLocalLegal([]);
        return;
      }
      const piece = localGame.get(square);
      if (piece && piece.color === localGame.turn()) {
        const moves = localGame.moves({ square, verbose: true });
        setLocalSelected(square);
        setLocalLegal(moves.map((m) => m.to as Square));
      } else {
        setLocalSelected(null);
        setLocalLegal([]);
      }
    },
    [localGame]
  );

  // Handle piece drag start.
  const onPieceDragBegin = useCallback(
    (_piece: string, sourceSquare: Square) => {
      if (!interactive || effectiveIsGameOver) return false;
      if (useLocal) selectLocalSquare(sourceSquare);
      else storeSelect(sourceSquare);
      return true;
    },
    [interactive, effectiveIsGameOver, useLocal, selectLocalSquare, storeSelect]
  );

  // Handle piece drop.
  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square, piece: string) => {
      if (!interactive) return false;

      const isPawnPromotion =
        piece[1] === 'P' &&
        ((piece[0] === 'w' && targetSquare[1] === '8') ||
          (piece[0] === 'b' && targetSquare[1] === '1'));

      if (isPawnPromotion) {
        setPromotionSquare({ from: sourceSquare, to: targetSquare });
        setShowPromotion(true);
        return false;
      }

      if (onMove) {
        const ok = onMove(sourceSquare, targetSquare);
        if (ok && useLocal) {
          setLocalSelected(null);
          setLocalLegal([]);
          setLocalLastMove({ from: sourceSquare, to: targetSquare });
        }
        return ok;
      }
      return storeMove(sourceSquare, targetSquare);
    },
    [interactive, onMove, storeMove, useLocal]
  );

  // Handle promotion selection.
  const onPromotionPieceSelect = useCallback(
    (piece?: PromotionPiece, promoteFromSquare?: Square, promoteToSquare?: Square) => {
      setShowPromotion(false);
      if (!piece) return false;

      const from = promoteFromSquare || promotionSquare?.from;
      const to = promoteToSquare || promotionSquare?.to;
      if (!from || !to) return false;

      setPromotionSquare(null);
      const pieceSymbol = extractPieceSymbol(piece);

      if (onMove) {
        const ok = onMove(from, to, pieceSymbol);
        if (ok && useLocal) {
          setLocalSelected(null);
          setLocalLegal([]);
          setLocalLastMove({ from, to });
        }
        return ok;
      }
      return storeMove(from, to, pieceSymbol);
    },
    [promotionSquare, onMove, storeMove, useLocal]
  );

  // Handle square click.
  const onSquareClick = useCallback(
    (square: Square) => {
      if (!interactive || effectiveIsGameOver) return;

      // If a square is already selected and the click is a legal target, move.
      if (effectiveSelected && effectiveLegal.includes(square)) {
        const sourceGame = useLocal ? localGame! : storeGame;
        const piece = sourceGame.get(effectiveSelected);
        const isPawnPromotion =
          piece?.type === 'p' &&
          ((piece.color === 'w' && square[1] === '8') ||
            (piece.color === 'b' && square[1] === '1'));

        if (isPawnPromotion) {
          setPromotionSquare({ from: effectiveSelected, to: square });
          setShowPromotion(true);
          return;
        }

        if (onMove) {
          const ok = onMove(effectiveSelected, square);
          if (ok && useLocal) {
            setLocalSelected(null);
            setLocalLegal([]);
            setLocalLastMove({ from: effectiveSelected, to: square });
          }
        } else {
          storeMove(effectiveSelected, square);
        }
        return;
      }

      if (useLocal) selectLocalSquare(square);
      else storeSelect(square);
    },
    [
      interactive,
      effectiveIsGameOver,
      effectiveSelected,
      effectiveLegal,
      useLocal,
      localGame,
      storeGame,
      onMove,
      storeMove,
      selectLocalSquare,
      storeSelect,
    ]
  );

  const onSquareRightClick = useCallback(() => {
    /* Future: arrow drawing */
  }, []);

  // Size to the container, capped by `boardWidth`.
  const [containerRef, containerWidth] = useContainerWidth<HTMLDivElement>();
  const maxWidth = boardWidth || 560;
  const resolvedWidth = containerWidth > 0 ? Math.min(maxWidth, containerWidth) : maxWidth;

  const orientation =
    boardOrientation === 'w' || boardOrientation === 'white'
      ? 'white'
      : boardOrientation === 'b' || boardOrientation === 'black'
      ? 'black'
      : config.orientation === 'w'
      ? 'white'
      : 'black';

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden', className)}
      style={{ maxWidth }}
    >
      <Chessboard
        id="chess-board"
        position={customFen || storeFen}
        boardWidth={resolvedWidth}
        boardOrientation={orientation}
        showBoardNotation={showCoordinates}
        animationDuration={animationDuration}
        arePiecesDraggable={interactive && !effectiveIsGameOver}
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
