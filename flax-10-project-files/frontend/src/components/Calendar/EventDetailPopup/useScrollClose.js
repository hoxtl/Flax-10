import { useEffect } from 'react';

/**
 * Registers a capture-phase scroll listener that calls `onClose`
 * when the anchor rect is outside the viewport.
 *
 * @param {{ top: number, bottom: number } | null} anchorRect
 * @param {() => void} onClose
 */

export function useScrollClose(anchorRect, onClose) {
  useEffect(() => {
    if (!anchorRect) return undefined;

    const handleScroll = () => {
      const isOutOfViewAbove = anchorRect.top < 0;
      const isOutOfViewBelow = anchorRect.bottom > window.innerHeight;
      if (isOutOfViewAbove || isOutOfViewBelow) onClose?.();
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [anchorRect, onClose]);
}

