import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect, useMemo } from "react";
import styles from "./WelcomeBackgroundPaths.module.css";

function buildPaths(flip = 1, count = 28) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    strokeOpacity: 0.18 + i * 0.001,
    width: 0.9 + i * 0.03,
    start: Math.random(),
    d: `M-${380 - i * 5 * flip} -${189 + i * 6}
      C-${380 - i * 5 * flip} -${189 + i * 6} -${312 - i * 5 * flip} ${216 - i * 6}
      ${152 - i * 5 * flip} ${343 - i * 6}
      C${616 - i * 5 * flip} ${470 - i * 6} ${684 - i * 5 * flip} ${875 - i * 6}
      ${684 - i * 5 * flip} ${875 - i * 6}`,
  }));
}

function pathInitial(start) {
  return { pathLength: 1, pathOffset: start, opacity: 0.65 };
}
function pathAnimate(start) {
  return { pathOffset: [start, start + 1], opacity: [0.35, 0.7, 0.35] };
}
function pathTransition(flip) {
  return { duration: (flip === 1 ? 7 : 10) + Math.random() * 3, repeat: Infinity, ease: "linear" };
}

function PathItem({ p, flip }) {
  return (
    <motion.path
      key={`${flip}-${p.id}`} d={p.d} stroke="currentColor"
      strokeWidth={p.width} strokeOpacity={p.strokeOpacity}
      initial={pathInitial(p.start)} animate={pathAnimate(p.start)}
      transition={pathTransition(flip)}
    />
  );
}

function FloatingPaths({ flip = 1 }) {
  const paths = useMemo(() => buildPaths(flip, 28), [flip]);
  return (
    <div className={styles.paths}>
      <svg className={styles.svg} viewBox="0 0 696 316" fill="none" aria-hidden="true">
        {paths.map((p) => <PathItem key={`${flip}-${p.id}`} p={p} flip={flip} />)}
      </svg>
    </div>
  );
}

function useParallaxMotion(reduceMotion) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 70, damping: 18, mass: 0.6 });
  const y = useSpring(my, { stiffness: 70, damping: 18, mass: 0.6 });
  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e) => {
      mx.set(((e.clientX / (window.innerWidth || 1)) - 0.5) * 10);
      my.set(((e.clientY / (window.innerHeight || 1)) - 0.5) * 10);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduceMotion]);
  return { x, y };
}

export default function WelcomeBackgroundPaths() {
  const reduceMotion = useReducedMotion();
  const { x, y } = useParallaxMotion(reduceMotion);
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.glow} />
      <motion.div className={styles.parallax} style={{ x, y }}>
        <FloatingPaths flip={1} />
        <FloatingPaths flip={-1} />
      </motion.div>
      <div className={styles.fade} />
    </div>
  );
}