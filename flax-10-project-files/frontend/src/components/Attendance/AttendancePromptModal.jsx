import styles from "./AttendancePrompt.module.css";

/** Single responsibility: render the "Did you attend?" dialog UI. */
export default function AttendancePromptModal({ event, submitting, onAnswer, onDismiss }) {
  return (
    <div className={styles.overlay} role="dialog" aria-labelledby="attendance-prompt-title">
      <div className={styles.card}>
        <button
          type="button"
          className={styles.close}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
        <h2 id="attendance-prompt-title" className={styles.question}>
          Did you attend?
        </h2>
        <p className={styles.eventTitle}>{event.title}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnYes}
            onClick={() => onAnswer(true)}
            disabled={submitting}
          >
            Yes
          </button>
          <button
            type="button"
            className={styles.btnNo}
            onClick={() => onAnswer(false)}
            disabled={submitting}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}
