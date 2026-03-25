/*
 * Animated celebration emoji that bounces and rotates into view.
 */

import { motion } from "framer-motion";
import styles from "./CelebrationEmoji.module.css";

/** Emoji that animates in with a bounce and rotation effect on mount. */

export default function CelebrationEmoji({ emoji = "🎉", className = "", size = "2.4rem" }) {
  return (
    <motion.span className={className ? `${styles.emoji} ${className}` : styles.emoji}
      aria-hidden style={{ "--celebration-size": size }}
      initial={{ opacity: 0, scale: 0.45, rotate: -18 }}
      animate={{ opacity: 1, scale: [0.45, 1.16, 0.98, 1], rotate: [-18, 8, -3, 0] }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
      {emoji}
    </motion.span>
  );
}
