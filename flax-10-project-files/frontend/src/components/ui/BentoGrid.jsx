/**
 * Bento grid layout components.
 */

import { useRef } from "react";
import { motion } from "framer-motion";
import styles from "./BentoGrid.module.css";
import { useGlowPosition } from "./bento_grid/useGlowPosition";

const MotionDiv = motion.div;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
  },
};

export function BentoGrid({ children, className }) {
  return (
    <MotionDiv
      className={[styles.grid, className].filter(Boolean).join(" ")}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </MotionDiv>
  );
}

export function BentoCard({ children, className }) {
  const cardRef = useRef(null);
  const { glowPos, handleMouseMove, resetGlow } = useGlowPosition(cardRef);

  return (
    <MotionDiv className={[styles.cardWrapper, className].filter(Boolean).join(" ")} variants={cardVariants}>
      <div ref={cardRef} className={styles.card} onMouseMove={handleMouseMove} onMouseLeave={resetGlow}>
        <div
          className={styles.glow}
          style={glowPos}
          aria-hidden
        />
        <div className={styles.hoverOverlay} aria-hidden />
        <div className={styles.content}>{children}</div>
      </div>
    </MotionDiv>
  );
}
