/*
 * Timer feature file.
 */

import styles from '../styles/MiniTimer.module.css';
import { formatTime } from './TimerComponents';
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/timer/components/MiniTimer.jsx
import { useTimerContext } from '../../../context/TimerContext';
import Tooltip from '../../common/Tooltip/Tooltip';
=======
import { useTimerContext } from '../../context/TimerContext';
import Tooltip from '../common/tooltip/Tooltip';
>>>>>>> main:flax-10-project-files/frontend/src/components/timer/MiniTimer.jsx

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
