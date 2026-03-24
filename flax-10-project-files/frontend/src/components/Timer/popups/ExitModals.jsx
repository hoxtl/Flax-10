/*
 * Leave timer and end-early confirmation modals.
 */

import { motion, useReducedMotion } from 'framer-motion';
import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import StandardModal from '../../common/StandardModal/StandardModal';

function buildLeaveState(timeLeftSeconds, sessionTotalSeconds) {
  const safeTotal = Math.max(1, Number(sessionTotalSeconds || 0));
  const safeLeft = Math.max(0, Number(timeLeftSeconds || 0));
  const minutesLeft = Math.max(1, Math.ceil(safeLeft / 60));
  const progressPct = Math.max(0, Math.min(100, Math.round(((safeTotal - safeLeft) / safeTotal) * 100)));
  return { minutesLeft, progressPct, minutesLabel: `${minutesLeft} min${minutesLeft === 1 ? '' : 's'}` };
}

function LeaveProgress({ progressPct, minutesLeft }) {
  const reduceMotion = useReducedMotion();
  const width = `${progressPct}%`;

  return (
    <div className={styles.leaveNudgeProgressCard}>
      <div className={styles.leaveNudgeProgressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}>
        <motion.span
          className={styles.leaveNudgeProgressFill}
          style={reduceMotion ? { width } : undefined}
          initial={reduceMotion ? false : { width: 0, opacity: 0.55 }}
          animate={reduceMotion ? undefined : { width, opacity: 1 }}
          transition={reduceMotion ? undefined : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className={styles.leaveNudgeProgressMeta}>
        <span>{progressPct}% complete</span>
        <span>{minutesLeft}m left</span>
      </div>
    </div>
  );
}

function LeaveActions({ onCancel, onExit, onTakeBreak, onPause }) {
  const handleTakeBreak = () => (onTakeBreak ? onTakeBreak() : onPause?.());

  return (
    <>
      <div className={styles.leaveNudgeActions}>
        <PrimaryButton className={styles.leaveNudgeStayBtn} variant="ghost" pill onClick={onCancel}>Keep Focusing</PrimaryButton>
        <PrimaryButton className={styles.leaveNudgeEndBtn} variant="secondary" pill onClick={onExit}>Yes, end session</PrimaryButton>
      </div>
      <PrimaryButton className={styles.leaveNudgeBreakBtn} variant="primary" pill onClick={handleTakeBreak}>Take a 5m Break instead</PrimaryButton>
    </>
  );
}

export function LeaveTimerModal({ onCancel, onPause, onExit, onTakeBreak, timeLeftSeconds = 0, sessionTotalSeconds = 0 }) {
  const state = buildLeaveState(timeLeftSeconds, sessionTotalSeconds);

  return (
    <StandardModal title="Hold on, you're doing great!" subtitle="Are you sure you want to end your focus session early?" onClose={onCancel} size="sm" modalClassName={styles.leaveNudgeModal} contentClassName={styles.leaveNudgeModalContent}>
      <div className={styles.leaveNudgeBody}>
        <div className={styles.leaveNudgeLoss}>You are <span className={styles.leaveNudgeMinutes}>{state.minutesLabel}</span> away from finishing this session. If you quit now, this progress will not be added to your daily goal.</div>
        <LeaveProgress progressPct={state.progressPct} minutesLeft={state.minutesLeft} />
        <LeaveActions onCancel={onCancel} onExit={onExit} onTakeBreak={onTakeBreak} onPause={onPause} />
      </div>
    </StandardModal>
  );
}

function buildEndEarlyState(elapsedSeconds, goalSeconds) {
  const safeGoal = Math.max(60, Number(goalSeconds || 0));
  const safeElapsed = Math.max(0, Math.min(safeGoal, Number(elapsedSeconds || 0)));
  const minutesDone = Math.max(0, Math.floor(safeElapsed / 60));
  const minutesGoal = Math.max(1, Math.round(safeGoal / 60));
  const minutesLeft = Math.max(0, Math.ceil((safeGoal - safeElapsed) / 60));
  const progressPct = Math.max(0, Math.min(100, Math.round((safeElapsed / safeGoal) * 100)));
  return { minutesLeft, progressPct, minutesDoneLabel: `${minutesDone} minute${minutesDone === 1 ? '' : 's'}`, minutesGoalLabel: `${minutesGoal}-minute` };
}

function EndEarlySummary({ state }) {
  const suffix = state.minutesLeft > 0 ? <>You&apos;re so close to your <span className={styles.endSessionHighlight}>{state.minutesGoalLabel}</span> goal.</> : <>You&apos;ve already reached your <span className={styles.endSessionHighlight}>{state.minutesGoalLabel}</span> target.</>;

  return (
    <p className={styles.endSessionRecapText}>
      You&apos;ve focused for <span className={styles.endSessionHighlight}>{state.minutesDoneLabel}</span>. {suffix}
    </p>
  );
}

function EndEarlyHeader({ onCancel }) {
  return (
    <div className={styles.endSessionHead}>
      <h2 className={styles.endSessionTitle}>Finish session now?</h2>
      <button type="button" className={styles.endSessionCloseBtn} onClick={onCancel} aria-label="Close">×</button>
    </div>
  );
}

export function EndEarlyModal({ onConfirm, onCancel, elapsedSeconds = 0, goalSeconds = 0 }) {
  const state = buildEndEarlyState(elapsedSeconds, goalSeconds);

  return (
    <StandardModal onClose={onCancel} size="sm" hideHeader backdropClassName={styles.endSessionBackdrop} modalClassName={styles.endSessionModal} contentClassName={styles.endSessionContent}>
      <div className={styles.endSessionBody}>
        <EndEarlyHeader onCancel={onCancel} />
        <div className={styles.endSessionRecapLabel}>Session recap</div>
        <EndEarlySummary state={state} />
        <LeaveProgress progressPct={state.progressPct} minutesLeft={state.minutesLeft} />
        <div className={styles.endSessionActions}>
          <PrimaryButton className={styles.endSessionKeepBtn} variant="primary" pill onClick={onCancel}>Keep Going</PrimaryButton>
          <PrimaryButton className={styles.endSessionQuitBtn} variant="ghost" pill onClick={onConfirm}>Yes, I&apos;m done for now</PrimaryButton>
        </div>
      </div>
    </StandardModal>
  );
}
