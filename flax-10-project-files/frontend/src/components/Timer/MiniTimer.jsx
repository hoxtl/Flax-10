/*
 * Timer feature file.
 */

<<<<<<< HEAD
=======
import { useState } from 'react';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from './MiniTimer.module.css';
import { formatTime } from './TimerComponents';
import { useTimerContext } from '../../context/TimerContext';
import Tooltip from '../common/tooltip/Tooltip';

export default function MiniTimer({ onNavigate, activeNav }) {
  const { isActive, isPaused, timeLeft, totalPaused, mode, isOvertime, isBreakOvertime } = useTimerContext();
  if (!isActive || activeNav === 'timer') return null;
  const getLabel = () => isPaused ? '⏸️ Paused' : (mode === 'work' ? (isOvertime ? '🚀 Overtime' : '🔥 Focus') : (isBreakOvertime ? '⏳ Break Overtime' : '☕ Break Time'));
  const dot = <span className={`${styles.dot} ${isPaused ? styles.paused : ''}`} />;
  const time = <span className={styles.time}>{isPaused ? formatTime(totalPaused) : formatTime(timeLeft)}</span>;
  return (
    <Tooltip content={`${getLabel()} · click to open`} position="bottom" wrapperClassName={styles.wrapper}>
      <button className={styles.miniTimer} onClick={() => onNavigate?.('timer')}>{dot}{time}</button>
    </Tooltip>
  );
}
