/*
 * Input composer for the study coach panel.
 */

import { ArrowUp } from "lucide-react";
import styles from "./studyCoachStyles";

export default function StudyCoachComposer({ input, loading, onChange, onKeyDown, onSend, placeholder }) {
  return (
    <div className={styles.inputRow}>
      <textarea className={styles.textarea} value={input} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} rows={1} disabled={loading} />
      <button className={styles.sendBtn} onClick={() => onSend()} disabled={loading || !input.trim()} aria-label="Send message">
        <ArrowUp size={22} strokeWidth={2.5} />
      </button>
    </div>
  );
}
