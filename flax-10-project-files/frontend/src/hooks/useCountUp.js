import { useRef, useEffect } from "react";

/**
 * Returns a ref whose .current animates from the previous value toward the target.
 * Used for display (e.g. day progress %). Target is the end value to count up to.
 */
export function useCountUp(target) {
  const ref = useRef(0);
  const prevTarget = useRef(target);

  useEffect(() => {
    const from = ref.current;
    const to = typeof target === "number" ? target : 0;
    if (from === to) {
      prevTarget.current = to;
      return;
    }
    prevTarget.current = to;
    const start = performance.now();
    const duration = 400;

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      ref.current = Math.round(from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);

  return ref;
}
