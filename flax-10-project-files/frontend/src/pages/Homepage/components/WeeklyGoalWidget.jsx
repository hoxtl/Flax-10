/**
 * WeeklyGoalWidget
 * Shows weekly study-time progress toward a configurable goal.
 * Study time is read from Pomodoro timer sessions stored in localStorage
 * under the key "pomodoroSessions" (written by the timer page).
 * Goal is stored in localStorage under "weeklyStudyGoalHours" (default 10h).
 */
import { useState, useEffect, useMemo, useCallback } from "react";
import { Target } from "lucide-react";
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
  } catch {
    return 0;
  }
}

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
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Target size={15} strokeWidth={1.75} aria-hidden />
        </div>
        <span className={styles.label}>WEEKLY GOAL</span>
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
}
