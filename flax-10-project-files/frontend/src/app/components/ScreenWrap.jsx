import { motion } from "framer-motion";
import { fadeAnim, ROOT_STYLE } from "../constants";

export function ScreenWrap({ animKey, children }) {
  return (
    <motion.div
      key={animKey}
      variants={fadeAnim}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25 }}
      style={ROOT_STYLE}
    >
      {children}
    </motion.div>
  );
}
