/*
 * Context-aware prompt bubble for opening the study coach.
 */

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import styles from "../FloatingChat.module.css";

const MotionDiv = motion.div;

export default function ChatPromptBubble({ onAsk, onMinimize, text }) {
  return (
    <MotionDiv className={styles.promptBubble} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
      <div className={styles.promptHeader}>
        <p className={styles.promptText}>{text || "Not sure how long a task will take? Ask me!"}</p>
        <button className={styles.promptMinimize} onClick={onMinimize} aria-label="Minimize">
          <ChevronDown size={14} />
        </button>
      </div>
      <div className={styles.promptActions}>
        <PrimaryButton className={styles.promptCta} onClick={onAsk} pill size="small">
          Ask Flax
        </PrimaryButton>
      </div>
      <div className={styles.promptArrow} />
    </MotionDiv>
  );
}
