import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useEffect } from "react";
import styles from "./WelcomeBackgroundPaths.module.css";

function FloatingPaths({ flip = 1 }) {
  const paths = Array.from({ length: 30 }, (_, i) => {
    const opacity = 0.05 + i * 0.012;
    const width = 0.7 + i * 0.03;

    const d = `M-${380 - i * 5 * flip} -${189 + i * 6}
      C-${380 - i * 5 * flip} -${189 + i * 6} -${312 - i * 5 * flip} ${
      216 - i * 6
    } ${152 - i * 5 * flip} ${343 - i * 6}
      C${616 - i * 5 * flip} ${470 - i * 6} ${684 - i * 5 * flip} ${
      875 - i * 6
    } ${684 - i * 5 * flip} ${875 - i * 6}`;

    return { id: i, d, opacity, width };
  });

  return (
    <div className={styles.paths}>
      <svg
        className={styles.svg}
        viewBox="0 0 696 316"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        {paths.map((p) => (
          <motion.path
            key={`${flip}-${p.id}`}
            d={p.d}
            stroke="currentColor"
            strokeWidth={p.width}
            strokeOpacity={p.opacity}
            initial={{ pathLength: 0.2, opacity: 0.45 }}
            animate={{
              pathLength: 1,
              opacity: [0.25, 0.55, 0.12],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 50 + Math.random() * 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function WelcomeBackgroundPaths() {
  const reduceMotion = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const x = useSpring(mx, { stiffness: 70, damping: 18 });
  const y = useSpring(my, { stiffness: 70, damping: 18 });

  useEffect(() => {
    if (reduceMotion) return;

    const onMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;

      const px = (e.clientX / w - 0.5) * 2;
      const py = (e.clientY / h - 0.5) * 2;

      mx.set(px * 5);
      my.set(py * 5);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduceMotion]);

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
