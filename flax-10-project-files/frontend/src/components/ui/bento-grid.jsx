import { useRef, useState } from "react";
import { motion } from "framer-motion";
import styles from "./bento-grid.module.css";

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
    <motion.div
      className={[styles.grid, className].filter(Boolean).join(" ")}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function BentoCard({ children, className }) {
  const cardRef = useRef(null);
  const [glowPos, setGlowPos] = useState({ x: "50%", y: "50%" });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlowPos({ x: `${x}%`, y: `${y}%` });
  };

  return (
    <motion.div
      className={[styles.cardWrapper, className].filter(Boolean).join(" ")}
      variants={cardVariants}
    >
      <div
        ref={cardRef}
        className={styles.card}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setGlowPos({ x: "50%", y: "50%" })}
      >
        <div
          className={styles.glow}
          style={{ "--glow-x": glowPos.x, "--glow-y": glowPos.y }}
          aria-hidden
        />
        <div className={styles.hoverOverlay} aria-hidden />
        <div className={styles.content}>{children}</div>
      </div>
    </motion.div>
  );
}
