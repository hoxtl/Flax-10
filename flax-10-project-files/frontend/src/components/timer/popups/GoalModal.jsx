/*
 * Goal completion modal.
 */

import { useState } from 'react';
import styles from '../../../pages/Timer/TimerPage.module.css';
import PrimaryButton from '../../common/primary_button/PrimaryButton';
import StandardModal from '../../common/standard_modal/StandardModal';
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

function GoalSummary({ sessions, workTime, breakTime }) {
  return (
    <div className={styles.goalReachedSummary}>
      <p className={styles.goalReachedSummaryText}>You've completed all your scheduled sessions. Amazing work!</p>
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

export function GoalModal({ sessions, workTime, breakTime, onAction }) {
  const [mood, setMood] = useState(null);
  const handleComplete = () => completeGoal(mood, onAction);

  return (
    <StandardModal title="Goal reached" onClose={handleComplete} size="sm" backdropClassName={styles.endSessionBackdrop} modalClassName={styles.goalReachedModal} contentClassName={styles.goalReachedContent}>
      <div className={styles.goalReachedBody}>
        <div className={styles.goalReachedRecapLabel}>Session recap</div>
        <GoalSummary sessions={sessions} workTime={workTime} breakTime={breakTime} />
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
