/**
 * Weekly goal widget.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Target } from "lucide-react";
import SharedWidgetHeader from "../../../components/common/WidgetHeader/WidgetHeader";
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
  } catch {
    return 0;
  }
}

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
}
