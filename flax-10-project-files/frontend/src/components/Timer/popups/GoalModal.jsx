/*
 * Goal completion modal.
 */

import { useState } from 'react';
<<<<<<< HEAD
import styles from '../../../pages/timer/TimerPage.module.css';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import StandardModal from '../../common/standard_modal/StandardModal';
=======
import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../common/PrimaryButton/PrimaryButton';
import StandardModal from '../../common/StandardModal/StandardModal';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { formatTime } from '../TimerComponents';

const MOODS = [
  { key: 'hard', emoji: '😤', label: 'Hard' },
  { key: 'good', emoji: '😊', label: 'Good' },
  { key: 'locked_in', emoji: '🔥', label: 'Locked in' },
];

function SummaryPill({ label, value, type }) {
  return (
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={`${styles.summaryPill} ${styles[`pill${type}`]}`}>{value}</span>
    </div>
  );
}

<<<<<<< HEAD
function GoalSummary({ sessions, workTime, breakTime }) {
  return (
    <div className={styles.goalReachedSummary}>
      <p className={styles.goalReachedSummaryText}>You've completed all your scheduled sessions. Amazing work!</p>
=======
function GoalSummary({ sessions, workTime, breakTime, distractionCount }) {
  const distractionText = distractionCount > 0 ? `You stayed focused, but had ${distractionCount} interruption${distractionCount > 1 ? 's' : ''}.` : 'Clean focus run — no interruptions tracked.';

  return (
    <div className={styles.goalReachedSummary}>
      <p className={styles.goalReachedSummaryText}>You've completed all your scheduled sessions. Amazing work!</p>
      <p className={styles.goalReachedSummaryText}>{distractionText}</p>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      <div className={styles.goalReachedStats}>
        <SummaryPill label="✅ Sessions" value={sessions} type="Sessions" />
        <SummaryPill label="🔥 Focus" value={formatTime(workTime)} type="Focus" />
        <SummaryPill label="☕ Break" value={formatTime(breakTime)} type="Break" />
      </div>
    </div>
  );
}

function persistMood(mood) {
  if (!mood) return;
  try { sessionStorage.setItem('lastSessionMood', mood); } catch {}
}

function MoodPicker({ mood, setMood }) {
  return (
    <div className={styles.moodPickerRow}>
      <span className={styles.moodPickerLabel}>How did that feel?</span>
      <div className={styles.moodOptions}>
        {MOODS.map((option) => <MoodButton key={option.key} option={option} mood={mood} setMood={setMood} />)}
      </div>
    </div>
  );
}

function MoodButton({ option, mood, setMood }) {
  const className = `${styles.moodBtn} ${mood === option.key ? styles.moodBtnActive : ''}`;

  return (
    <button className={className} onClick={() => setMood(option.key)}>
      <span>{option.emoji}</span>
      <span className={styles.moodBtnLabel}>{option.label}</span>
    </button>
  );
}

<<<<<<< HEAD
export function GoalModal({ sessions, workTime, breakTime, onAction }) {
=======
export function GoalModal({ sessions, workTime, breakTime, onAction, distractionCount = 0 }) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const [mood, setMood] = useState(null);
  const handleComplete = () => completeGoal(mood, onAction);

  return (
    <StandardModal title="Goal reached" onClose={handleComplete} size="sm" backdropClassName={styles.endSessionBackdrop} modalClassName={styles.goalReachedModal} contentClassName={styles.goalReachedContent}>
      <div className={styles.goalReachedBody}>
        <div className={styles.goalReachedRecapLabel}>Session recap</div>
<<<<<<< HEAD
        <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} />
=======
        <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} distractionCount={distractionCount} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        <MoodPicker mood={mood} setMood={setMood} />
        <PrimaryButton className={styles.goalReachedButton} variant="primary" onClick={handleComplete} pill>Start New Goal</PrimaryButton>
      </div>
    </StandardModal>
  );
}

function completeGoal(mood, onAction) {
  persistMood(mood);
  onAction();
}
