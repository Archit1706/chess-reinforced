'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Measures an element's content width and keeps it updated on resize.
 * Used to size the chess boards responsively (react-chessboard needs a pixel
 * width, so we feed it the live container width instead of a fixed number).
 *
 * Returns a ref to attach to the container and its current width in px.
 */
export function useContainerWidth<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    // Re-measure once after layout settles, in case the first read was taken
    // before flex/grid constraints were applied.
    const raf = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return [ref, width] as const;
}
