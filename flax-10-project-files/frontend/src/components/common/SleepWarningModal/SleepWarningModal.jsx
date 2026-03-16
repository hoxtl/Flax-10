import PrimaryButton from "../PrimaryButton/PrimaryButton";
import styles from './SleepWarningModal.module.css';

export function SleepWarningModal({ sleepTime, wakeTime, onConfirm, onCancel }) {
  const formatTime = (t) => {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div data-testid="sleep-warning" className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="sleep-warning-title">
      <div className={styles.modal}>
        <h2 id="sleep-warning-title" className={styles.title}>
          You should be resting!
        </h2>
        <p className={styles.body}>
          Your sleep schedule is set from <strong>{formatTime(sleepTime)}</strong> to{" "}
          <strong>{formatTime(wakeTime)}</strong>. Working at this hour can
          affect your focus and wellbeing the next day.
        </p>
        <p className={styles.question}>Are you sure you want to work at this hour?</p>
        <div className={styles.actions}>
          <PrimaryButton className={styles.cancelBtn} variant="ghost" pill onClick={onCancel} autoFocus>
            Cancel - I&apos;ll rest
          </PrimaryButton>
          <PrimaryButton className={styles.confirmBtn} pill onClick={onConfirm}>
            Add anyway
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
