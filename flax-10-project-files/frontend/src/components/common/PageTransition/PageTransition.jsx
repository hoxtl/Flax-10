/*
 * Motion wrapper for smooth page entrance and exit transitions.
 */

import { motion } from "framer-motion";
import { STANDARD_EASE } from "../motion/transitions";

const PAGE_MOTION = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.995 },
  transition: { duration: 0.28, ease: STANDARD_EASE },
};

/** Wraps page content with a standard entrance and exit animation. */

export default function PageTransition({ children, className, style }) {
  return (
    <motion.div className={className} style={style} {...PAGE_MOTION}>
      {children}
    </motion.div>
  );
}
