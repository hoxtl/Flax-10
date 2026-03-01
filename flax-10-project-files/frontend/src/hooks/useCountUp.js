import { useRef, useEffect } from "react";

/**
 * Animates a numeric value from 0 to `target` using cubic ease-out.
 * Attach the returned ref to the DOM element that should display the number.
 * Mirrors the count-up animation used on the Analytics summary cards.
 */
export function useCountUp(target, duration = 900) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = target * ease;
      if (ref.current) {
        ref.current.textContent =
          target % 1 !== 0 ? current.toFixed(1) : Math.round(current).toString();
      }
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [target, duration]);
  return ref;
}
