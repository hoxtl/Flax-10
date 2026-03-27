/*
 * Typing state bubble for the study coach.
 */

import styles from "../styles/studyCoachStyles";

export default function TypingIndicator() {
  return (
    <div className={`${styles.bubble} ${styles.bubbleAI}`}>
      <span className={styles.dot} style={{ animationDelay: "0ms" }} />
      <span className={styles.dot} style={{ animationDelay: "160ms" }} />
      <span className={styles.dot} style={{ animationDelay: "320ms" }} />
    </div>
  );
}
