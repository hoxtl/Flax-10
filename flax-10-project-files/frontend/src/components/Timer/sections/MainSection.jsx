/*
 * Main timer card content.
 */

import { useCallback } from 'react';
<<<<<<< HEAD
import { motion } from 'framer-motion';
import styles from '../../../pages/timer/TimerPage.module.css';
import SessionDots, { LiveStatsRow } from '../SessionDots';
import { TaskInput } from '../TaskInput';
import { TimerRing } from '../TimerCircle';
import { TimerControls } from '../TimerComponents';
import { useSuggestedTimerTask } from '../hooks/useSuggestedTimerTask';
import { clearManualTask, startManualTask } from '../utils/timerTaskActions';
import { applyTaskToTimer } from '../utils/presetUtils';

=======
import styles from '../../../pages/Timer/TimerPage.module.css';
import SessionDots, { LiveStatsRow, ProgressStrip } from '../SessionDots';
import { TaskInput } from '../TaskInput';
import { TimerRing } from '../TimerCircle';
import { TimerControls, ModeIndicator } from '../TimerComponents';
import { useSuggestedTimerTask } from '../hooks/useSuggestedTimerTask';
import { clearManualTask, startManualTask, startSuggestedTask } from '../utils/timerTaskActions';
import { applyTaskToTimer } from '../utils/presetUtils';

function estimatedFinishTime(t) {
  const remaining = t.targetSessions - t.completedSessions;
  if (remaining <= 0) return null;
  const sessionSec = t.workTime * 60 + t.breakTime * 60;
  const totalSec = t.isActive || t.isPaused ? Math.max(t.timeLeft, 0) + (remaining - 1) * sessionSec : remaining * sessionSec;
  return new Date(Date.now() + totalSec * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function MobileHistoryButton({ isMobile, onOpenHistory }) {
  if (!isMobile) return null;
  return <button className={styles.mobileHistoryBtn} onClick={onOpenHistory}>View History 📜</button>;
}

function TimerTopSection({ t, onOpenFocus }) {
  useSuggestedTimerTask(t);

  return (
<<<<<<< HEAD
    <TaskInput
=======
      <TaskInput
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      value={t.task}
      onChange={t.setTask}
      onClearTask={() => clearManualTask(t)}
      onTaskSelect={(task) => applyTaskToTimer(task, t)}
<<<<<<< HEAD
=======
      onJustStart={() => startSuggestedTask(t)}
      isSessionActive={Boolean(t.isActive || t.isPaused)}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      onOpenFocus={onOpenFocus}
    />
  );
}

<<<<<<< HEAD
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
=======
function TimerInfoSection({ t, onPrimaryStart, onOpenFocus }) {
  const finishAt = estimatedFinishTime(t);

  return (
    <div className={styles.timerCenterContent}>
      <div className={styles.sessionProgression}>
        <div className={styles.sessionLabel}>Session {t.completedSessions + 1} of {t.targetSessions}</div>
        <SessionDots completedSessions={t.completedSessions} targetSessions={t.targetSessions} isActive={t.isActive} isPaused={t.isPaused} />
      </div>

      <div className={styles.ringWrapper}>
        <TimerRing t={t} />
      </div>

      <div className={styles.timerBottomLabels}>
        <div className={styles.mainModeLabel}>Focus</div>
        {finishAt && <div className={styles.estimatedFinish}>Done by ~{finishAt}</div>}
      </div>

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      <TimerControls isActive={t.isActive} isPaused={t.isPaused} onToggle={onPrimaryStart} onPause={t.togglePause} onReset={t.resetTimer} onEndEarly={() => t.setModal('endEarly')} totalPaused={t.totalPaused} />
    </div>
  );
}

export function MainSection({ t, onOpenHistory, onOpenFocus, isMobile }) {
  const onPrimaryStart = useCallback(() => startManualTask(t), [t]);

  return (
<<<<<<< HEAD
    <motion.div layout layoutRoot transition={{ layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }} className={styles.timerMainCard}>
      <TimerTopSection t={t} onOpenFocus={onOpenFocus} />
      <TimerInfoSection t={t} onPrimaryStart={onPrimaryStart} />
      <LiveStatsRow blockTotalWork={t.blockTotalWork} blockTotalBreak={t.blockTotalBreak} totalPaused={t.totalPaused} isActive={t.isActive} isPaused={t.isPaused} />
      <MobileHistoryButton isMobile={isMobile} onOpenHistory={onOpenHistory} />
    </motion.div>
=======
    <div className={styles.timerMainCard}>
      <TimerTopSection t={t} onOpenFocus={onOpenFocus} />
      <TimerInfoSection t={t} onPrimaryStart={onPrimaryStart} />
      <LiveStatsRow blockTotalWork={t.blockTotalWork} blockTotalBreak={t.blockTotalBreak} totalPaused={t.totalPaused} distractions={t.distractionCount} isActive={t.isActive} isPaused={t.isPaused} onDistract={t.addDistraction} />
      <MobileHistoryButton isMobile={isMobile} onOpenHistory={onOpenHistory} />
    </div>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  );
}
