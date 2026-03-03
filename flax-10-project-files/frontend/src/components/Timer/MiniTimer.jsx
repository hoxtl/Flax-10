import { useState } from 'react';
import styles from './MiniTimer.module.css';
import { formatTime } from './TimerComponents';
import { useTimerContext } from '../../context/TimerContext';

export default function MiniTimer({ onNavigate, activeNav }) {
  const { isActive, isPaused, timeLeft, mode, isOvertime, isBreakOvertime } = useTimerContext();
  const [hovered, setHovered] = useState(false);

  if (!isActive || activeNav === 'timer') return null;

  const label = isPaused ? '⏸️ Paused' : (mode === 'work'
    ? (isOvertime ? '🚀 Overtime' : '🔥 Focus')
    : (isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time'));

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button className={styles.miniTimer} onClick={() => onNavigate?.('timer')}>
        <span className={`${styles.dot} ${isPaused ? styles.paused : ''}`} />
        <span className={styles.time}>{formatTime(timeLeft)}</span>
      </button>

      <div className={`${styles.tooltip} ${hovered ? styles.visible : ''}`}>
        <span className={styles.tooltipLabel}>{label}</span>
        <span className={styles.tooltipHint}>click to open</span>
      </div>
    </div>
  );
}
