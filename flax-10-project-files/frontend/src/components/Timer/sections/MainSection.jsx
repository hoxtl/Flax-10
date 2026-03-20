/*
 * Main timer card content.
 */

import { useCallback } from 'react';
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
      onJustStart={() => startSuggestedTask(t)}
      isSessionActive={Boolean(t.isActive || t.isPaused)}
      onOpenFocus={onOpenFocus}
    />
  );
}

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

      <TimerControls isActive={t.isActive} isPaused={t.isPaused} onToggle={onPrimaryStart} onPause={t.togglePause} onReset={t.resetTimer} onEndEarly={() => t.setModal('endEarly')} totalPaused={t.totalPaused} />
    </div>
  );
}

export function MainSection({ t, onOpenHistory, onOpenFocus, isMobile }) {
  const onPrimaryStart = useCallback(() => startManualTask(t), [t]);

  return (
    <div className={styles.timerMainCard}>
      <TimerTopSection t={t} onOpenFocus={onOpenFocus} />
      <TimerInfoSection t={t} onPrimaryStart={onPrimaryStart} />
      <LiveStatsRow blockTotalWork={t.blockTotalWork} blockTotalBreak={t.blockTotalBreak} totalPaused={t.totalPaused} distractions={t.distractionCount} isActive={t.isActive} isPaused={t.isPaused} onDistract={t.addDistraction} />
      <MobileHistoryButton isMobile={isMobile} onOpenHistory={onOpenHistory} />
    </div>
  );
}
