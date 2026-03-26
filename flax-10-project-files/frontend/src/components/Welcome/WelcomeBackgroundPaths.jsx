import { motion as Motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useMemo } from "react";
import styles from "./WelcomeBackgroundPaths.module.css";

const PATH_COUNT = 28;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildPathD(i, flip) {
  return `M-${380 - i * 5 * flip} -${189 + i * 6}
    C-${380 - i * 5 * flip} -${189 + i * 6} -${312 - i * 5 * flip} ${216 - i * 6}
    ${152 - i * 5 * flip} ${343 - i * 6}
    C${616 - i * 5 * flip} ${470 - i * 6} ${684 - i * 5 * flip} ${875 - i * 6}
    ${684 - i * 5 * flip} ${875 - i * 6}`;
}

function buildPaths(flip, count, intensity) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    strokeOpacity: clamp((0.17 + i * 0.0028) * intensity, 0.14, 0.78),
    width: clamp((0.92 + i * 0.038) * Math.min(intensity, 1.6), 0.9, 2.8),
    start: Math.random(),
    d: buildPathD(i, flip),
  }));
}

function pathInitial(start, intensity) {
  return { pathLength: 1, pathOffset: start, opacity: clamp(0.52 * intensity, 0.38, 0.92) };
}

function pathAnimate(start, intensity) {
  const minOpacity = clamp(0.34 * intensity, 0.24, 0.82);
  const peakOpacity = clamp(0.8 * intensity, 0.52, 1);
  return { pathOffset: [start, start + 1], opacity: [minOpacity, peakOpacity, minOpacity] };
}

function pathTransition(flip, intensity, speed) {
  const speedBoost = Math.max(0, intensity - 1);
  const baseDuration = flip === 1 ? 7 : 10;
  return {
    duration: (Math.max(3.2, baseDuration - speedBoost * 1.8) + Math.random() * 1.2) / Math.max(speed, 0.1),
    repeat: Infinity,
    ease: "linear",
  };
}

function PathItem({ p, flip, intensity, speed }) {
  return (
    <Motion.path
      d={p.d}
      stroke="currentColor"
      strokeWidth={p.width}
      strokeOpacity={p.strokeOpacity}
      initial={pathInitial(p.start, intensity)}
      animate={pathAnimate(p.start, intensity)}
      transition={pathTransition(flip, intensity, speed)}
    />
  );
}

function FloatingPaths({ flip, count, intensity, speed }) {
  const flipUsed = flip ?? 1;
  const paths = useMemo(() => buildPaths(flipUsed, count, intensity), [count, flipUsed, intensity]);

  return (
    <div className={styles.paths}>
      <svg className={styles.svg} viewBox="0 0 696 316" fill="none" aria-hidden="true">
        {paths.map((p) => (
          <PathItem key={`${flipUsed}-${p.id}`} p={p} flip={flipUsed} intensity={intensity} speed={speed} />
        ))}
      </svg>
    </div>
  );
}

function getViewportSize() {
  return { w: window.innerWidth || 1, h: window.innerHeight || 1 };
}

function applyParallax(mx, my, e) {
  const { w, h } = getViewportSize();
  mx.set((e.clientX / w - 0.5) * 10);
  my.set((e.clientY / h - 0.5) * 10);
}

function useParallaxMotion(reduceMotion) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 70, damping: 18, mass: 0.6 });
  const y = useSpring(my, { stiffness: 70, damping: 18, mass: 0.6 });

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e) => applyParallax(mx, my, e);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduceMotion]);

  return { x, y };
}

export default function WelcomeBackgroundPaths({ embedded = false, className = "", count = PATH_COUNT, intensity = 1, speed = 1 }) {
  const reduceMotion = useReducedMotion();
  const { x, y } = useParallaxMotion(reduceMotion);

  const parallaxStyle = { x, y };
  const bgClassName = [styles.bg, embedded ? styles.bgEmbedded : "", className].filter(Boolean).join(" ");
  return (
    <div className={bgClassName} aria-hidden="true">
      <div className={styles.glow} />
      <Motion.div className={styles.parallax} style={parallaxStyle}>
        <FloatingPaths count={count} intensity={intensity} speed={speed} />
        <FloatingPaths flip={-1} count={count} intensity={intensity} speed={speed} />
      </Motion.div>
      <div className={styles.fade} />
    </div>
  );
}
