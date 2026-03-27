/*
 * Floating action button for the study coach launcher.
 */

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import styles from "./styles/FloatingChat.module.css";

const MotionButton = motion.button;
const MotionSpan = motion.span;

export default function FloatingChatFab({ open, minimized, onClick }) {
  return (
    <MotionButton className={styles.fab} onClick={onClick} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} aria-label={getAriaLabel(open, minimized)}>
      <AnimatePresence mode="wait">
        {open ? <CloseIcon /> : <OpenIcon />}
      </AnimatePresence>
    </MotionButton>
  );
}

function OpenIcon() {
  return (
    <MotionSpan key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
      <MessageCircle size={20} />
    </MotionSpan>
  );
}

function CloseIcon() {
  return (
    <MotionSpan key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
      <X size={20} />
    </MotionSpan>
  );
}

function getAriaLabel(open, minimized) {
  if (open) return "Close chat";
  return minimized ? "Show prompt" : "Open chat";
}
