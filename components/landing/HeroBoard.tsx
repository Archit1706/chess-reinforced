'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Animated 3D hero board: loops the finale of Morphy's Opera Game (1858) —
 * 16.Qb8+!! Nxb8 17.Rd8# — on a CSS-3D tilted board. The position and moves
 * are the real ones (the full game ships in the Study section).
 *
 * Pure CSS transforms + framer-motion; no WebGL. Honors reduced-motion by
 * freezing on the checkmate position.
 */

// Position after 15...Nxd7 of the Opera Game, then the two-move combination.
// `squares[step]` is each piece's square at that step; null = captured.
interface PieceDef {
  id: string;
  glyph: string;
  white: boolean;
  squares: (string | null)[];
}

const STEPS = 4;

const still = (sq: string): (string | null)[] => [sq, sq, sq, sq];

const PIECES: PieceDef[] = [
  // White
  { id: 'wK', glyph: '♚', white: true, squares: still('c1') },
  { id: 'wQ', glyph: '♛', white: true, squares: ['b3', 'b8', null, null] }, // 16.Qb8+!!, then Nxb8
  { id: 'wR', glyph: '♜', white: true, squares: ['d1', 'd1', 'd1', 'd8'] }, // 17.Rd8#
  { id: 'wB', glyph: '♝', white: true, squares: still('g5') },
  { id: 'wPa', glyph: '♟', white: true, squares: still('a2') },
  { id: 'wPb', glyph: '♟', white: true, squares: still('b2') },
  { id: 'wPc', glyph: '♟', white: true, squares: still('c2') },
  { id: 'wPe', glyph: '♟', white: true, squares: still('e4') },
  { id: 'wPf', glyph: '♟', white: true, squares: still('f2') },
  { id: 'wPg', glyph: '♟', white: true, squares: still('g2') },
  { id: 'wPh', glyph: '♟', white: true, squares: still('h2') },
  // Black
  { id: 'bK', glyph: '♚', white: false, squares: still('e8') },
  { id: 'bQ', glyph: '♛', white: false, squares: still('e6') },
  { id: 'bR', glyph: '♜', white: false, squares: still('h8') },
  { id: 'bB', glyph: '♝', white: false, squares: still('f8') },
  { id: 'bN', glyph: '♞', white: false, squares: ['d7', 'd7', 'b8', 'b8'] }, // 16...Nxb8
  { id: 'bPa', glyph: '♟', white: false, squares: still('a7') },
  { id: 'bPe', glyph: '♟', white: false, squares: still('e5') },
  { id: 'bPf', glyph: '♟', white: false, squares: still('f7') },
  { id: 'bPg', glyph: '♟', white: false, squares: still('g7') },
  { id: 'bPh', glyph: '♟', white: false, squares: still('h7') },
];

const CAPTIONS = [
  'The Opera Game · Paris, 1858',
  '16. Qb8+!!',
  '16…Nxb8',
  '17. Rd8# — checkmate',
];

// Milliseconds each step holds before advancing.
const STEP_HOLD = [2200, 1500, 1500, 3200];

/** 'b3' → { left, top } percentages from White's perspective. */
function squarePos(square: string): { left: string; top: string } {
  const col = square.charCodeAt(0) - 97; // a → 0
  const row = 8 - parseInt(square[1], 10); // rank 8 → row 0
  return { left: `${col * 12.5}%`, top: `${row * 12.5}%` };
}

export function HeroBoard({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  // Reduced motion: freeze on the final mate position.
  const [step, setStep] = useState(reduceMotion ? STEPS - 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setTimeout(
      () => setStep((s) => (s + 1) % STEPS),
      STEP_HOLD[step]
    );
    return () => clearTimeout(id);
  }, [step, reduceMotion]);

  const mate = step === 3;

  return (
    <div className={className}>
      {/* Idle bob (2D, kept separate from the 3D tilt below) */}
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div style={{ perspective: '1100px' }}>
          {/* 88% on small screens: the perspective projection widens the near
              edge past the layout box, which otherwise clips on ~375px phones. */}
          <div
            className="relative mx-auto w-[88%] sm:w-full max-w-[520px]"
            style={{
              transform: 'rotateX(50deg) rotateZ(0.001deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Board plane */}
            <div
              className="relative aspect-square w-full rounded-lg ring-1 ring-black/40 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Squares */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 overflow-hidden rounded-lg">
                {Array.from({ length: 64 }, (_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const dark = (row + col) % 2 === 1;
                  return (
                    <div
                      key={i}
                      className={dark ? 'bg-[#8a6547]' : 'bg-[#d9bd93]'}
                    />
                  );
                })}
              </div>

              {/* Checkmate glow on the black king's square */}
              <motion.div
                className="absolute rounded-sm pointer-events-none"
                style={{ ...squarePos('e8'), width: '12.5%', height: '12.5%' }}
                animate={{
                  boxShadow: mate
                    ? '0 0 0 3px rgba(239,68,68,0.9), 0 0 34px 10px rgba(239,68,68,0.55)'
                    : '0 0 0 0px rgba(239,68,68,0)',
                }}
                transition={{ duration: 0.5 }}
              />

              {/* Pieces */}
              {PIECES.map((piece) => {
                const square = piece.squares[step];
                // Keep captured pieces mounted at their last square so they
                // fade out in place instead of unmounting abruptly.
                const lastSquare =
                  square ??
                  [...piece.squares].reverse().find((s): s is string => s !== null) ??
                  'a1';
                const pos = squarePos(lastSquare);
                const captured = square === null;
                const toppled = mate && piece.id === 'bK';

                return (
                  <motion.div
                    key={piece.id}
                    className="absolute pointer-events-none"
                    style={{
                      width: '12.5%',
                      height: '12.5%',
                      transformStyle: 'preserve-3d',
                    }}
                    initial={false}
                    animate={{ ...pos, opacity: captured ? 0 : 1 }}
                    transition={{
                      left: { duration: 0.65, ease: [0.3, 0.9, 0.3, 1] },
                      top: { duration: 0.65, ease: [0.3, 0.9, 0.3, 1] },
                      opacity: { duration: captured ? 0.45 : 0.6, delay: captured ? 0.35 : 0 },
                    }}
                  >
                    {/* Ground shadow — lies flat on the board plane */}
                    <span className="absolute left-1/2 top-[62%] h-[30%] w-[64%] -translate-x-1/2 rounded-full bg-black/35 blur-[3px]" />
                    {/* Glyph — counter-rotated so it stands upright */}
                    <motion.span
                      className={[
                        'absolute inset-0 flex items-end justify-center select-none',
                        'text-[clamp(24px,6vw,52px)] leading-none',
                        piece.white
                          ? 'text-[#f6f1e7] [text-shadow:0_2px_2px_rgba(0,0,0,0.55),0_0_1px_#3d2c1e,1px_0_1px_#3d2c1e,-1px_0_1px_#3d2c1e]'
                          : 'text-[#231a12] [text-shadow:0_2px_3px_rgba(0,0,0,0.5),0_0_10px_rgba(0,0,0,0.25)]',
                      ].join(' ')}
                      style={{
                        transformOrigin: '50% 100%',
                        transform: 'rotateX(-50deg)',
                      }}
                      animate={{ rotateZ: toppled ? 68 : 0 }}
                      transition={{
                        duration: 0.7,
                        delay: toppled ? 0.55 : 0,
                        ease: [0.35, 1.4, 0.6, 1],
                      }}
                    >
                      {piece.glyph}
                    </motion.span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Glow under the board */}
        <div
          aria-hidden
          className="mx-auto -mt-8 h-16 w-3/4 rounded-[100%] bg-primary-500/25 blur-3xl"
        />
      </motion.div>

      {/* Move caption */}
      <div className="mt-2 flex items-center justify-center">
        <motion.p
          key={step}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={[
            'font-mono text-sm tracking-wide',
            mate ? 'text-red-400' : 'text-white/60',
          ].join(' ')}
        >
          {CAPTIONS[step]}
        </motion.p>
      </div>
    </div>
  );
}
