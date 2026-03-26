/*
 * Session progress dots and live stats.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import { fmtDuration } from './utils/timerFormatters';

function getDotState(index, completedSessions, isActive, isPaused) {
  if (index < completedSessions) return { className: styles.sessionDotDone, label: '✓' };
  if (index === completedSessions && (isActive || isPaused)) return { className: styles.sessionDotActive, label: '' };
  return { className: styles.sessionDotPending, label: '' };
}

function SessionDot({ index, completedSessions, isActive, isPaused }) {
  const dot = getDotState(index, completedSessions, isActive, isPaused);

  return (
    <span className={`${styles.sessionDot} ${dot.className}`} aria-hidden={dot.label !== '✓'}>
      {dot.label === '✓' && <span className={styles.sessionDotCheckmark}>{dot.label}</span>}
    </span>
  );
}

export default function SessionDots({ completedSessions, targetSessions, isActive, isPaused }) {
  const label = `Session ${completedSessions + 1} of ${targetSessions}`;

  return (
    <div className={styles.sessionDots} aria-label={label}>
      {Array.from({ length: targetSessions }).map((_, index) => <SessionDot key={index} index={index} completedSessions={completedSessions} isActive={isActive} isPaused={isPaused} />)}
    </div>
  );
}

function PausedStat({ totalPaused }) {
  if (totalPaused <= 30) return null;
  return <span className={styles.liveStat}>⏸ <strong>{fmtDuration(totalPaused)}</strong> paused</span>;
}

export function LiveStatsRow({ blockTotalWork, blockTotalBreak, totalPaused, isActive, isPaused }) {
  const everStarted = isActive || isPaused || blockTotalWork > 0 || blockTotalBreak > 0;
  if (!everStarted) return null;

  return (
    <div className={styles.liveStatsRow}>
      <span className={styles.liveStat}>🔥 <strong>{blockTotalWork > 0 ? fmtDuration(blockTotalWork) : '—'}</strong> focus</span>
      <span className={styles.liveStat}>☕ <strong>{blockTotalBreak > 0 ? fmtDuration(blockTotalBreak) : '—'}</strong> break</span>
      <PausedStat totalPaused={totalPaused} />
    </div>
  );
}

export function ProgressStrip({ value }) {
  const width = `${Math.max(0, Math.min(100, value))}%`;

  return (
    <div className={styles.linearProgressWrap}>
      <div className={styles.linearProgressBar}>
        <span className={styles.linearProgressFill} style={{ width }} />
      </div>
    </div>
  );
}
