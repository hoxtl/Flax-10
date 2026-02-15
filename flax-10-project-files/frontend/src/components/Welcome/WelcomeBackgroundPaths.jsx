import { motion } from "framer-motion";
import styles from "./WelcomeBackgroundPaths.module.css";

function FloatingPaths({ flip = 1 }) {
  const paths = Array.from({ length: 50 }, (_, i) => {
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
      <svg className={styles.svg} viewBox="0 0 696 316" fill="none" aria-hidden="true">
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
              opacity: [0.25, 0.55, 0.25],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
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
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.glow} />
      <FloatingPaths flip={1} />
      <FloatingPaths flip={-1} />
      <div className={styles.fade} />
    </div>
  );
}
