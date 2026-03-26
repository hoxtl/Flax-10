/*
 * Editable daily goal field for the timer banner.
 */

import styles from '../../../pages/Timer/TimerPage.module.css';

function persistGoal(value, setGoalHours, setEditingGoal) {
  const hours = parseFloat(value);
  if (!Number.isNaN(hours) && hours > 0) saveGoal(hours, setGoalHours);
  setEditingGoal(false);
}

function saveGoal(hours, setGoalHours) {
  setGoalHours(hours);
  try { localStorage.setItem('timerDailyGoalHours', String(hours)); } catch {}
}

function GoalInput({ goalInput, setGoalInput, setGoalHours, setEditingGoal }) {
  return (
    <input className={styles.todayGoalInput} type="number" min={0.5} max={24} step={0.5} value={goalInput} autoFocus onChange={(event) => setGoalInput(event.target.value)} onBlur={() => persistGoal(goalInput, setGoalHours, setEditingGoal)} onKeyDown={(event) => handleGoalKeyDown(event, goalInput, setGoalHours, setEditingGoal)} />
  );
}

function handleGoalKeyDown(event, goalInput, setGoalHours, setEditingGoal) {
  if (event.key === 'Enter') return persistGoal(goalInput, setGoalHours, setEditingGoal);
  if (event.key === 'Escape') setEditingGoal(false);
}

function GoalToggle({ goalHours, setGoalInput, setEditingGoal }) {
  return <button className={styles.todayGoalEditBtn} onClick={() => openEditor(goalHours, setGoalInput, setEditingGoal)}>{goalHours}h</button>;
}

function openEditor(goalHours, setGoalInput, setEditingGoal) {
  setGoalInput(String(goalHours));
  setEditingGoal(true);
}

export function GoalEditor(props) {
  if (props.editingGoal) return <GoalInput {...props} />;
  return <GoalToggle {...props} />;
}
