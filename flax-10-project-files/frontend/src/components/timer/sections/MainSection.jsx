/*
 * Main timer card content.
 */

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from '../../../pages/timer/TimerPage.module.css';
import SessionDots, { LiveStatsRow } from '../components/SessionDots';
import { TaskInput } from '../components/TaskInput';
import { TimerRing } from '../components/TimerCircle';
import { TimerControls } from '../components/TimerComponents';
import { useSuggestedTimerTask } from '../hooks/useSuggestedTimerTask';
import { clearManualTask, startManualTask } from '../utils/timerTaskActions';
import { applyTaskToTimer } from '../utils/presetUtils';

function MobileHistoryButton({ isMobile, onOpenHistory }) {
  if (!isMobile) return null;
  return <button className={styles.mobileHistoryBtn} onClick={onOpenHistory}>View History 📜</button>;
}

function TimerTopSection({ t, onOpenFocus }) {
  useSuggestedTimerTask(t);

  return (
    <TaskInput
      value={t.task}
      onChange={t.setTask}
      onClearTask={() => clearManualTask(t)}
      onTaskSelect={(task) => applyTaskToTimer(task, t)}
      onOpenFocus={onOpenFocus}
    />
  );
}

function SessionProgress({ t }) {
  return (
    <div className={styles.sessionProgression}>
      <div className={styles.sessionLabel}>Session {t.completedSessions + 1} of {t.targetSessions}</div>
      <SessionDots completedSessions={t.completedSessions} targetSessions={t.targetSessions} isActive={t.isActive} isPaused={t.isPaused} />
    </div>
  );
}

function TimerInfoSection({ t, onPrimaryStart }) {
  return (
    <div className={styles.timerCenterContent}>
      <SessionProgress t={t} />
      <div className={styles.ringWrapper}>
        <TimerRing t={t} />
      </div>
      <TimerControls isActive={t.isActive} isPaused={t.isPaused} onToggle={onPrimaryStart} onPause={t.togglePause} onReset={t.resetTimer} onEndEarly={() => t.setModal('endEarly')} totalPaused={t.totalPaused} />
    </div>
  );
}

export function MainSection({ t, onOpenHistory, onOpenFocus, isMobile }) {
  const onPrimaryStart = useCallback(() => startManualTask(t), [t]);

  return (
    <motion.div layout layoutRoot transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }} className={styles.timerMainCard}>
      <TimerTopSection t={t} onOpenFocus={onOpenFocus} />
      <TimerInfoSection t={t} onPrimaryStart={onPrimaryStart} />
      <LiveStatsRow blockTotalWork={t.blockTotalWork} blockTotalBreak={t.blockTotalBreak} totalPaused={t.totalPaused} isActive={t.isActive} isPaused={t.isPaused} />
      <MobileHistoryButton isMobile={isMobile} onOpenHistory={onOpenHistory} />
    </motion.div>
  );
}
