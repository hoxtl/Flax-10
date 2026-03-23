/*
 * Motion wrapper for smooth page entrance and exit transitions.
 */

import { motion } from "framer-motion";
import { pageMotion } from "../motion/transitions";

/** Wraps page content with a standard entrance and exit animation. */

export default function PageTransition({ children, className, style }) {
  return (
    <motion.div className={className} style={style} {...pageMotion}>
      {children}
    </motion.div>
  );
}
