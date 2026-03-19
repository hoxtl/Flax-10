import { useEffect } from 'react';

/**
 * Calls `onClose` when the user presses the mouse button down outside the referenced element.
 */
export function useClickOutside(ref, onClose) {
  useEffect(() => {
    if (!ref?.current) return undefined;

    const handleMouseDown = (event) => {
      const el = ref.current;
      if (!el) return;
      if (el.contains(event.target)) return;
      onClose?.();
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [ref, onClose]);
}

