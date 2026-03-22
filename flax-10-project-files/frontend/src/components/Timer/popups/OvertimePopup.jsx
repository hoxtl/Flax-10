/*
 * Overtime timer modals.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../Common/PrimaryButton/PrimaryButton';
import StandardModal from '../../Common/StandardModal/StandardModal';
import { formatTime } from '../TimerComponents';

function getOvertimeCopy(mode, isLastSession) {
  return {
    title: mode === 'work' ? "Time's Up!" : 'Break Over!',
    subtitle: mode === 'work' ? "You're in overtime mode." : 'Time to get back to work.',
    buttonLabel: mode === 'work' ? (isLastSession ? 'Finish Goal' : 'Start Break') : 'Start Work',
  };
}

export function OvertimePopup({ mode, time, onAction, isLastSession }) {
  const copy = getOvertimeCopy(mode, isLastSession);

  return (
    <StandardModal title={copy.title} subtitle={copy.subtitle} onClose={onAction} size="sm" centerText>
      <div className={styles.overtimeContent}>
        <div className={styles.overtimeTime}>{formatTime(time)}</div>
        <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>{copy.buttonLabel}</PrimaryButton>
      </div>
    </StandardModal>
  );
}

export function BreakStartedPopup({ time, onAction }) {
  return (
    <StandardModal title="Break started" subtitle="Use this moment to reset." onClose={onAction} size="sm" centerText>
      <div className={styles.autoBreakContent}>
        <div className={styles.autoBreakLabel}>Next focus session in</div>
        <div className={styles.autoBreakTime}>{formatTime(time)}</div>
        <p className={styles.autoBreakText}>A 5-minute micro-break gives your brain a clean reset.</p>
        <PrimaryButton className={`${styles.button} ${styles.primary}`} onClick={onAction} pill>Skip Break</PrimaryButton>
      </div>
    </StandardModal>
  );
}
