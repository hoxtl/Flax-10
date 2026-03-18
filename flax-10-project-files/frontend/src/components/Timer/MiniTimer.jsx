import { useState } from 'react';
import styles from './MiniTimer.module.css';
import { formatTime } from './TimerComponents';
import { useTimerContext } from '../../context/TimerContext';

export default function MiniTimer({ onNavigate, activeNav }) {
  const { isActive, isPaused, timeLeft, totalPaused, mode, isOvertime, isBreakOvertime } = useTimerContext();
  const [hovered, setHovered] = useState(false);
  if (!isActive || activeNav === 'timer') return null;
  const getLabel = () => isPaused ? '⏸️ Paused' : (mode === 'work' ? (isOvertime ? '🚀 Overtime' : '🔥 Focus') : (isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time'));
  const dot = <span className={`${styles.dot} ${isPaused ? styles.paused : ''}`} />;
  const time = <span className={styles.time}>{isPaused ? formatTime(totalPaused) : formatTime(timeLeft)}</span>;
  const btn = <button className={styles.miniTimer} onClick={() => onNavigate?.('timer')}>{dot}{time}</button>;
  const toolLbl = <span className={styles.tooltipLabel}>{getLabel()}</span>;
  const toolHint = <span className={styles.tooltipHint}>click to open</span>;
  const tooltip = <div className={`${styles.tooltip} ${hovered ? styles.visible : ''}`}>{toolLbl}{toolHint}</div>;
  return <div className={styles.wrapper} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>{btn}{tooltip}</div>;
}
