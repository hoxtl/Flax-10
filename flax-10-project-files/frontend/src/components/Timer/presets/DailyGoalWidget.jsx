/*
 * Small daily goal widget for the preset rail.
 */

import { useEffect, useState } from 'react';
<<<<<<< HEAD
import styles from '../../../pages/timer/TimerPage.module.css';
=======
import styles from '../../../pages/Timer/TimerPage.module.css';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { fmtDuration } from '../utils/timerFormatters';

function loadDailyGoalHours() {
  return parseFloat(localStorage.getItem('timerDailyGoalHours') || '4');
}

function persistDailyGoal(value, setGoalHours, setEditingGoal) {
  const hours = parseFloat(value);
  if (Number.isNaN(hours) || hours <= 0) return setEditingGoal(false);
  setGoalHours(hours);
  try { localStorage.setItem('timerDailyGoalHours', String(hours)); } catch {}
  return setEditingGoal(false);
}

function GoalInput({ goalInput, setGoalInput, setGoalHours, setEditingGoal }) {
  return (
    <input className={styles.todayGoalInput} type="number" min={0.5} max={24} step={0.5} value={goalInput} autoFocus onChange={(event) => setGoalInput(event.target.value)} onBlur={() => persistDailyGoal(goalInput, setGoalHours, setEditingGoal)} onKeyDown={(event) => handleGoalKeyDown(event, goalInput, setGoalHours, setEditingGoal)} />
  );
}

function handleGoalKeyDown(event, goalInput, setGoalHours, setEditingGoal) {
  if (event.key === 'Enter') return persistDailyGoal(goalInput, setGoalHours, setEditingGoal);
  if (event.key === 'Escape') setEditingGoal(false);
}

function GoalToggle({ goalHours, setGoalInput, setEditingGoal }) {
  return <button className={styles.todayGoalEditBtn} onClick={() => openGoalEditor(goalHours, setGoalInput, setEditingGoal)}>{goalHours}h</button>;
}

function openGoalEditor(goalHours, setGoalInput, setEditingGoal) {
  setGoalInput(String(goalHours));
  setEditingGoal(true);
}

<<<<<<< HEAD
export function GoalEditor(props) {
=======
function GoalEditor(props) {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (props.editingGoal) return <GoalInput {...props} />;
  return <GoalToggle {...props} />;
}

function loadStudiedHours(setStudiedHours) {
<<<<<<< HEAD
  let cancelled = false;

  import('../../../api/analyticsApi')
    .then((module) => module.default.getSummary(1))
    .then((result) => {
      if (!cancelled) setStudiedHours(result?.summary?.total_study_hours ?? 0);
    })
    .catch(() => {
      if (!cancelled) setStudiedHours(0);
    });

  return () => {
    cancelled = true;
  };
=======
  import('../../../api/analyticsApi').then((module) => {
    module.default.getSummary(1).then((result) => setStudiedHours(result?.summary?.total_study_hours ?? 0)).catch(() => setStudiedHours(0));
  });
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

export function DailyGoalWidget() {
  const [goalHours, setGoalHours] = useState(loadDailyGoalHours);
  const [studiedHours, setStudiedHours] = useState(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const progress = studiedHours === null || goalHours <= 0 ? 0 : Math.round((studiedHours / goalHours) * 100);
  const pct = Math.min(100, progress);
  const studiedText = studiedHours === null ? '…' : `${fmtDuration(Math.round((studiedHours || 0) * 3600))} of ${goalHours}h (${pct}%)`;

  useEffect(() => {
<<<<<<< HEAD
    return loadStudiedHours(setStudiedHours);
=======
    loadStudiedHours(setStudiedHours);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  }, []);
  return <DailyGoalWidgetView goalHours={goalHours} studiedText={studiedText} pct={pct} editingGoal={editingGoal} goalInput={goalInput} setGoalInput={setGoalInput} setEditingGoal={setEditingGoal} setGoalHours={setGoalHours} />;
}

function DailyGoalWidgetView(props) {
  return (
    <div className={styles.dailyGoalWidget}>
      <div className={styles.dailyGoalHeader}>
        <span className={styles.dailyGoalLabel}>Today's Goal</span>
        <GoalEditor {...props} />
      </div>
      <div className={styles.todayGoalBar}>
        <div className={styles.todayGoalFill} style={{ width: `${props.pct}%` }} />
      </div>
      <span className={styles.dailyGoalProgress}>{props.studiedText}</span>
    </div>
  );
}
