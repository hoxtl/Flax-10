import { useEffect, useRef } from 'react';

const applyCountUp = (ref, target, duration, start, now) => {
  const progress = Math.min((now - start) / duration, 1);
  const ease = 1 - Math.pow(1 - progress, 3);
  const current = target * ease;
  if (ref.current) {
    ref.current.textContent = target % 1 !== 0
      ? current.toFixed(1)
      : Math.round(current).toString();
  }
  return progress;
};

export function useCountUp(target, duration = 1000) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const start = performance.now();
    const tick = (now) => {
      const progress = applyCountUp(ref, target, duration, start, now);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return ref;
}
