import styles from '../../pages/Timer/TimerPage.module.css';
import { fmtDuration } from './utils/timerFormatters';

export default function SessionDots({ completedSessions, targetSessions, isActive, isPaused }) {
    return (
        <div className={styles.sessionDots} aria-label={`Session ${completedSessions + 1} of ${targetSessions}`}>
            {Array.from({ length: targetSessions }).map((_, i) => {
                const isDone = i < completedSessions;
                const isCurrentActive = i === completedSessions && (isActive || isPaused);
                const cls = isDone
                    ? styles.sessionDotDone
                    : isCurrentActive
                        ? styles.sessionDotActive
                        : styles.sessionDotPending;
                const label = isDone ? '✓' : (isCurrentActive ? String(i + 1) : '');
                return (
                    <span key={i} className={`${styles.sessionDot} ${cls}`} aria-hidden={!isDone}>
                        {isDone ? <span className={styles.sessionDotCheckmark}>{label}</span> : null}
                    </span>
                );
            })}
        </div>
    );
}

export function LiveStatsRow({ blockTotalWork, blockTotalBreak, totalPaused, distractions, isActive, isPaused, onDistract }) {
    const everStarted = isActive || isPaused || blockTotalWork > 0 || blockTotalBreak > 0;
    if (!everStarted) return null;
    return (
        <div className={styles.liveStatsRow}>
            <span className={styles.liveStat}>🔥 <strong>{blockTotalWork > 0 ? fmtDuration(blockTotalWork) : '—'}</strong> focus</span>
            <span className={styles.liveStat}>☕ <strong>{blockTotalBreak > 0 ? fmtDuration(blockTotalBreak) : '—'}</strong> break</span>
            {totalPaused > 30 && <span className={styles.liveStat}>⏸ <strong>{fmtDuration(totalPaused)}</strong> paused</span>}
            {distractions > 0 && <span className={styles.liveStat}>⚡ <strong>{distractions}</strong> distraction{distractions !== 1 ? 's' : ''}</span>}
            {isActive && !isPaused && (
                <button className={styles.distractChip} onClick={onDistract}>+ distracted</button>
            )}
        </div>
    );
}

export function ProgressStrip({ value }) {
    return (
        <div className={styles.linearProgressWrap}>
            <div className={styles.linearProgressBar}>
                <span className={styles.linearProgressFill} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
            </div>
        </div>
    );
}
