import { motion } from "framer-motion";
import { STANDARD_EASE } from "../motion/transitions";

const defaultMotion = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.995 },
  transition: { duration: 0.28, ease: STANDARD_EASE },
};

export default function PageTransition({ children, className, style }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={defaultMotion.initial}
      animate={defaultMotion.animate}
      exit={defaultMotion.exit}
      transition={defaultMotion.transition}
    >
      {children}
    </motion.div>
  );
}
