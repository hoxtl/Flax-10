import { useState } from "react";
import Card from "../../../../components/common/Card/Card";
import PrimaryButton from "../../../../components/common/PrimaryButton/PrimaryButton";
import widgetStyles from "./ProfileWidgets.module.css";
import weekStyles from "./ProfileWeekGoal.module.css";
const styles = { ...widgetStyles, ...weekStyles };

function GoalRingSvg({ percentage, radius }) {
  const circ = 2 * Math.PI * radius;
  const dash = (Math.min(percentage, 100) / 100) * circ;
  const color = percentage >= 100 ? "var(--success-text)" : "var(--primary)";
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" className={styles.goalRingSvg}>
      <circle cx="42" cy="42" r={radius} fill="none" stroke="var(--border)" strokeWidth="7" />
      <circle
        cx="42" cy="42" r={radius} fill="none"
        stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
    </svg>
  );
}

function GoalRing({ percentage, hoursStudied, goalHours, editing, onToggle }) {
  return (
    <button className={`${styles.goalRingBtn} ${editing ? styles.goalRingActive : ""}`} onClick={onToggle}>
      <GoalRingSvg percentage={percentage} radius={34} />
      <div className={styles.ringInner}>
        <span className={styles.ringValue}>{hoursStudied}h</span>
        <span className={styles.ringGoal}>/{goalHours}h</span>
      </div>
    </button>
  );
}

function GoalEditor({ val, onSave, onCancel, onChange }) {
  return (
    <div className={styles.goalEditorPanel}>
      <div className={styles.goalEditorLabel}>
        <span>Weekly target</span>
        <span className={styles.goalEditorHrs}>{val}h / week</span>
      </div>
      <input
        type="range" min="1" max="40" step="1"
        value={Math.min(val, 40)}
        onChange={e => onChange(parseInt(e.target.value))}
        className={styles.goalSlider}
      />
      <div className={styles.goalEditorActions}>
        <PrimaryButton className={styles.goalCancelBtn} variant="ghost" pill onClick={onCancel}>Cancel</PrimaryButton>
        <PrimaryButton className={styles.goalSaveBtn} pill onClick={() => onSave(val)}>Save goal</PrimaryButton>
      </div>
    </div>
  );
}

function StreakDisplay({ streaks }) {
  return (
    <div className={styles.streakRow}>
      <div className={styles.streakItem}>
        <span className={styles.streakNum}>{streaks?.current || "—"}</span>
        <span className={styles.streakMeta}>🔥 current</span>
      </div>
      <div className={styles.streakItem}>
        <span className={styles.streakNum}>{streaks?.longest || "—"}</span>
        <span className={styles.streakMeta}>🏆 best</span>
      </div>
    </div>
  );
}

function WeekRow({ weekly, showStreak, streaks, editing, setEditing }) {
  return (
    <div className={`${styles.weekRow} ${!showStreak ? styles.weekRowSolo : ""}`}>
      <div className={styles.goalRingWrap}>
        <GoalRing
          percentage={weekly.percentage}
          hoursStudied={weekly.hours_studied}
          goalHours={weekly.goal_hours}
          editing={editing}
          onToggle={() => setEditing(!editing)}
        />
        <span className={styles.ringCaption}>{editing ? "tap to close" : "tap to edit goal"}</span>
      </div>
      {showStreak && <StreakDisplay streaks={streaks} />}
    </div>
  );
}

function WeekEditor({ editing, tempGoal, setTempGoal, setEditing, onSave }) {
  if (!editing) return null;
  return (
    <div className={styles.goalEditorOpen}>
      <GoalEditor val={tempGoal} onChange={setTempGoal} onSave={onSave} onCancel={() => setEditing(false)} />
    </div>
  );
}

export function ThisWeek({ weekly, streaks, onGoalSave, showStreak = true }) {
  const [editing, setEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(weekly?.goal_hours || 20);
  if (!weekly) return null;
  const handleSave = (n) => { onGoalSave(n); setEditing(false); };
  return (
    <Card className={`${styles.glassCard} ${styles.weekCard}`} variant="glass">
      <div className={styles.cardLabel}>THIS WEEK</div>
      <WeekRow weekly={weekly} streaks={streaks} showStreak={showStreak} editing={editing} setEditing={setEditing} />
      <WeekEditor editing={editing} tempGoal={tempGoal} setTempGoal={setTempGoal} setEditing={setEditing} onSave={handleSave} />
    </Card>
  );
}
