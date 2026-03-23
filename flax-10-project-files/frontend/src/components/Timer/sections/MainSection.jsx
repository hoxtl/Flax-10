/*
 * Main timer card content.
 */

import { useCallback } from 'react';
import styles from '../../../pages/Timer/TimerPage.module.css';
import SessionDots, { LiveStatsRow } from '../SessionDots';
import { TaskInput } from '../TaskInput';
import { TimerRing } from '../TimerCircle';
import { TimerControls } from '../TimerComponents';
import { useSuggestedTimerTask } from '../hooks/useSuggestedTimerTask';
import { clearManualTask, startManualTask } from '../utils/timerTaskActions';
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
      isSessionActive={Boolean(t.isActive || t.isPaused)}
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

function TimerBottomLabels({ finishAt }) {
  return (
    <div className={styles.timerBottomLabels}>
      <div className={styles.mainModeLabel}>Focus</div>
      {finishAt && <div className={styles.estimatedFinish}>Done by ~{finishAt}</div>}
    </div>
  );
}

function TimerInfoSection({ t, onPrimaryStart }) {
  const finishAt = estimatedFinishTime(t);

  return (
    <div className={styles.timerCenterContent}>
      <SessionProgress t={t} />
      <div className={styles.ringWrapper}>
        <TimerRing t={t} />
      </div>
      <TimerBottomLabels finishAt={finishAt} />
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
      <LiveStatsRow blockTotalWork={t.blockTotalWork} blockTotalBreak={t.blockTotalBreak} totalPaused={t.totalPaused} isActive={t.isActive} isPaused={t.isPaused} />
      <MobileHistoryButton isMobile={isMobile} onOpenHistory={onOpenHistory} />
    </div>
  );
}
