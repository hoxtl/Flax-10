/**
<<<<<<< HEAD
 * Weekly goal widget.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Target } from "lucide-react";
import SharedWidgetHeader from "../../../components/common/widget_header/WidgetHeader";
import styles from "../styles/WeeklyGoalWidget.module.css";

const GOAL_KEY = "weeklyStudyGoalHours";
const SESSION_KEY = "pomodoroSessions";
const DEFAULT_GOAL = 10;

export default function WeeklyGoalWidget() {
  const state = useWeeklyGoalState();
  const progress = useWeeklyGoalProgress(state.doneMinutes, state.goalHours);
  return <WeeklyGoalCard {...progress} {...state} />;
}

function useWeeklyGoalState() {
  const [goalHours, setGoalHours] = useState(readGoalHours);
  const [doneMinutes, setDoneMinutes] = useState(calcWeekMinutes);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goalHours));
  useEffect(() => setDoneMinutes(calcWeekMinutes()), []);
  return { draft, doneMinutes, editing, goalHours, saveGoal: useSaveGoal(draft, setEditing, setGoalHours), setDraft, setEditing };
}

function useSaveGoal(draft, setEditing, setGoalHours) {
  return useCallback(() => saveGoalDraft(draft, setEditing, setGoalHours), [draft, setEditing, setGoalHours]);
}

function saveGoalDraft(draft, setEditing, setGoalHours) {
  const nextGoal = Number(draft);
  if (nextGoal > 0) persistGoal(nextGoal, setGoalHours);
  setEditing(false);
}

function persistGoal(goalHours, setGoalHours) {
  setGoalHours(goalHours);
  localStorage.setItem(GOAL_KEY, String(goalHours));
}

function useWeeklyGoalProgress(doneMinutes, goalHours) {
  return useMemo(() => buildWeeklyProgress(doneMinutes, goalHours), [doneMinutes, goalHours]);
}

function buildWeeklyProgress(doneMinutes, goalHours) {
  const doneHours = doneMinutes / 60;
  const leftHours = Math.max(0, goalHours - doneHours);
  const pct = Math.min(100, (doneHours / goalHours) * 100);
  const pctLabel = Math.round(pct);
  return { barColor: getBarColor(pct), doneHours, leftHours, pct, pctLabel };
}

function getBarColor(pct) {
  if (pct >= 100) return "var(--sage)";
  if (pct >= 50) return "var(--color-primary)";
  return "var(--home-urgency-warning)";
}

function WeeklyGoalCard(props) {
  return <div className={styles.root}><WeeklyGoalHeader />{props.editing ? <GoalEditor {...props} /> : <GoalDisplay {...props} />}<GoalSummary {...props} /><GoalProgress {...props} /><GoalCaption pct={props.pct} pctLabel={props.pctLabel} /></div>;
}

function WeeklyGoalHeader() {
  return <SharedWidgetHeader icon={Target} title="Weekly Goal" />;
}

function GoalEditor({ draft, saveGoal, setDraft }) {
  return <div className={styles.editRow}><input type="number" min="1" max="80" className={styles.goalInput} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === "Enter" && saveGoal()} autoFocus /><span className={styles.goalInputLabel}>hrs / week</span><button className={styles.saveBtn} onClick={saveGoal}>Save</button></div>;
}

function GoalDisplay({ goalHours, setDraft, setEditing }) {
  return <button className={styles.goalDisplay} onClick={() => beginGoalEdit(goalHours, setDraft, setEditing)} title="Click to edit goal"><span className={styles.goalNum}>{goalHours}h</span><span className={styles.goalEdit}>✎</span></button>;
}

function beginGoalEdit(goalHours, setDraft, setEditing) {
  setDraft(String(goalHours));
  setEditing(true);
}

function GoalSummary({ doneHours, leftHours }) {
  return <p className={styles.sub}>{doneHours.toFixed(1)}h done{leftHours > 0 ? ` · ${leftHours.toFixed(1)}h left` : " · Goal reached! 🎉"}</p>;
}

function GoalProgress({ barColor, pct, pctLabel }) {
  return <div className={styles.trackWrap}><div className={styles.track}><div className={styles.fill} style={{ width: `${pct}%`, background: barColor }} /></div><span className={styles.pctLabel}>{pctLabel}%</span></div>;
}

function GoalCaption({ pct, pctLabel }) {
  return <p className={styles.caption}>{pct >= 100 ? "Excellent work this week!" : `${pctLabel}% of weekly target`}</p>;
}

function readGoalHours() {
  const goalHours = Number(localStorage.getItem(GOAL_KEY));
  return goalHours > 0 ? goalHours : DEFAULT_GOAL;
}

function calcWeekMinutes() {
  try {
    const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || "[]");
    return sessions.reduce(addWeeklyMinutes, 0);
=======
 * WeeklyGoalWidget
 * Shows weekly study-time progress toward a configurable goal.
 * Study time is read from Pomodoro timer sessions stored in localStorage
 * under the key "pomodoroSessions" (written by the timer page).
 * Goal is stored in localStorage under "weeklyStudyGoalHours" (default 10h).
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Target } from "lucide-react";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "../styles/WeeklyGoalWidget.module.css";

const GOAL_KEY  = "weeklyStudyGoalHours";
const SESSION_KEY = "pomodoroSessions";
const DEFAULT_GOAL = 10; // hours

/** Returns the start of the current week (Monday 00:00) */
function weekStart() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

/** Read pomodoro sessions from localStorage; returns total minutes this week */
function calcWeekMinutes() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const sessions = JSON.parse(raw);
    const monMs = weekStart().getTime();
    return sessions.reduce((sum, s) => {
      const t = new Date(s.endedAt || s.startedAt || 0).getTime();
      if (t >= monMs) return sum + (s.durationMins || s.duration || 25);
      return sum;
    }, 0);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  } catch {
    return 0;
  }
}

<<<<<<< HEAD
function addWeeklyMinutes(total, session) {
  return isSessionThisWeek(session) ? total + (session.durationMins || session.duration || 25) : total;
}

function isSessionThisWeek(session) {
  const sessionTime = new Date(session.endedAt || session.startedAt || 0).getTime();
  return sessionTime >= weekStart().getTime();
}

function weekStart() {
  const now = new Date();
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
=======
export default function WeeklyGoalWidget() {
  const [goalHours, setGoalHours] = useState(() => {
    const g = Number(localStorage.getItem(GOAL_KEY));
    return g > 0 ? g : DEFAULT_GOAL;
  });
  const [doneMinutes, setDoneMinutes] = useState(() => calcWeekMinutes());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(goalHours));

  // Refresh on mount
  useEffect(() => {
    setDoneMinutes(calcWeekMinutes());
  }, []);

  const doneHours   = doneMinutes / 60;
  const leftHours   = Math.max(0, goalHours - doneHours);
  const pct         = Math.min(100, (doneHours / goalHours) * 100);
  const pctLabel    = Math.round(pct);

  const saveGoal = useCallback(() => {
    const v = Number(draft);
    if (v > 0) {
      setGoalHours(v);
      localStorage.setItem(GOAL_KEY, String(v));
    }
    setEditing(false);
  }, [draft]);

  // Progress colour: theme-aware urgency
  const barColor = pct >= 100 ? "var(--sage)" : pct >= 50 ? "var(--color-primary)" : "var(--home-urgency-warning)";

  return (
    <div className={styles.root}>
      <div className={baseStyles.widgetHeader}>
        <div className={baseStyles.headerIconWrap}>
          <Target size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
        </div>
        <span className={baseStyles.headerTitle}>Weekly Goal</span>
      </div>

      {editing ? (
        <div className={styles.editRow}>
          <input
            type="number"
            min="1"
            max="80"
            className={styles.goalInput}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === "Enter" && saveGoal()}
            autoFocus
          />
          <span className={styles.goalInputLabel}>hrs / week</span>
          <button className={styles.saveBtn} onClick={saveGoal}>Save</button>
        </div>
      ) : (
        <button className={styles.goalDisplay} onClick={() => { setDraft(String(goalHours)); setEditing(true); }} title="Click to edit goal">
          <span className={styles.goalNum}>{goalHours}h</span>
          <span className={styles.goalEdit}>✎</span>
        </button>
      )}

      <p className={styles.sub}>
        {doneHours.toFixed(1)}h done
        {leftHours > 0
          ? ` · ${leftHours.toFixed(1)}h left`
          : " · Goal reached! 🎉"}
      </p>

      <div className={styles.trackWrap}>
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        <span className={styles.pctLabel}>{pctLabel}%</span>
      </div>

      <p className={styles.caption}>
        {pct >= 100
          ? "Excellent work this week!"
          : `${pctLabel}% of weekly target`}
      </p>
    </div>
  );
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
