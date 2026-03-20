/*
 * Focus overlay content.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';
import TimerCircle from '../TimerCircle';

function getFocusTask(t) {
  return t.task?.trim() || 'Deep focus session';
}

function getFocusModeLabel(t) {
  return t.mode === 'break' ? 'Break' : 'Focus';
}

function getSessionLabel(t) {
  const current = Math.min(t.completedSessions + 1, t.targetSessions || 1);
  const total = Math.max(t.targetSessions || 1, 1);
  return `Session ${current} of ${total}`;
}

function getProgressWidth(t) {
  return `${Math.max(0, Math.min(100, Number(t.progress || 0)))}%`;
}

function FocusRailStat({ label, value, children, alignRight = false }) {
  const className = alignRight ? `${styles.focusOverlayRailStat} ${styles.focusOverlayRailStatRight}` : styles.focusOverlayRailStat;

  return (
    <div className={className}>
      <span className={styles.focusOverlayRailLabel}>{label}</span>
      <span className={styles.focusOverlayRailValue}>{value}</span>
      {children}
    </div>
  );
}

function FocusRail({ t, onExitFocus }) {
  return (
    <div className={styles.focusOverlayRail}>
      <div className={styles.focusOverlayRailExit}>
        <button className={styles.focusOverlayRailBackBtn} onClick={onExitFocus}>Exit Focus</button>
      </div>
      <div className={styles.focusOverlayRailDivider} />
      <FocusRailStat label="Task" value={getFocusTask(t)} />
      <div className={styles.focusOverlayRailDivider} />
      <FocusProgressStat t={t} />
      <div className={styles.focusOverlayRailDivider} />
      <FocusRailStat label="Mode" value={getFocusModeLabel(t)} alignRight />
    </div>
  );
}

function FocusProgressStat({ t }) {
  return (
    <FocusRailStat label="Block" value={getSessionLabel(t)}>
      <div className={styles.focusOverlayRailProgress}>
        <span className={styles.focusOverlayRailProgressFill} style={{ width: getProgressWidth(t) }} />
      </div>
    </FocusRailStat>
  );
}

function FocusOverlayCard({ t }) {
  return (
    <div className={styles.focusOverlayMainCard} style={{ gridTemplateColumns: '1fr' }}>
      <TimerCircle t={t} />
    </div>
  );
}

export function FocusOverlayContent({ t, onExitFocus }) {
  return (
    <div className={styles.focusOverlayFrame}>
      <FocusRail t={t} onExitFocus={onExitFocus} />
      <FocusOverlayCard t={t} />
    </div>
  );
}
