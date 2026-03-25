/**
 * Weekly goal and streak widget.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Card from "../../../../components/common/Card/Card";
import PrimaryButton from "../../../../components/common/PrimaryButton/PrimaryButton";
import widgetStyles from "./ProfileWidgets.module.css";
import weekStyles from "./ProfileWeekGoal.module.css";
const styles = { ...widgetStyles, ...weekStyles };
const WEEK_EDITOR_TRANSITION = {
  height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  opacity: { duration: 0.18, ease: "easeOut" },
  y: { duration: 0.18, ease: "easeOut" },
};

function buildSliderPct(value) {
  const normalizedValue = Math.min(Math.max(value, 1), 40);
  return `${((normalizedValue - 1) / 39) * 100}%`;
}

function buildDisplayedWeekly(weekly, goalHoursOverride) {
  if (!weekly) return null;
  if (!goalHoursOverride) return weekly;
  const hoursStudied = Number(weekly.hours_studied || 0);
  const nextPercentage = goalHoursOverride > 0 ? Math.round((hoursStudied / goalHoursOverride) * 100) : weekly.percentage;
  return { ...weekly, goal_hours: goalHoursOverride, percentage: nextPercentage };
}

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
    <button
      type="button"
      className={`${styles.goalRingBtn} ${editing ? styles.goalRingActive : ""}`}
      onClick={onToggle}
    >
      <GoalRingSvg percentage={percentage} radius={34} />
      <div className={styles.ringInner}>
        <span className={styles.ringValue}>{hoursStudied}h</span>
        <span className={styles.ringGoal}>/{goalHours}h</span>
      </div>
    </button>
  );
}

function GoalEditor({ val, onSave, onCancel, onChange, isSaving }) {
  const saveLabel = isSaving ? "Saving..." : "Save goal";
  return (
    <div className={styles.goalEditorPanel}>
      <div className={styles.goalEditorLabel}>
        <span className={styles.goalEditorTitle}>Weekly target</span>
        <span className={styles.goalEditorHrs}>{val}h / week</span>
      </div>
      <GoalSlider value={val} onChange={onChange} isSaving={isSaving} />
      <GoalEditorActions saveLabel={saveLabel} onCancel={onCancel} onSave={() => onSave(val)} isSaving={isSaving} />
    </div>
  );
}

function GoalSlider({ value, onChange, isSaving }) {
  return <input type="range" min="1" max="40" step="1" value={Math.min(value, 40)} onChange={(event) => onChange(parseInt(event.target.value))} className={styles.goalSlider} style={{ "--slider-pct": buildSliderPct(value) }} disabled={isSaving} />;
}

function GoalEditorActions({ saveLabel, onCancel, onSave, isSaving }) {
  return <div className={styles.goalEditorActions}><PrimaryButton className={styles.goalCancelBtn} variant="ghost" size="small" pill onClick={onCancel} disabled={isSaving}>Cancel</PrimaryButton><PrimaryButton className={styles.goalSaveBtn} size="small" pill onClick={onSave} disabled={isSaving}>{saveLabel}</PrimaryButton></div>;
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

function WeekEditor({ editing, tempGoal, setTempGoal, setEditing, onSave, isSaving }) {
  return <AnimatePresence initial={false}>{editing && <WeekEditorPanel tempGoal={tempGoal} setTempGoal={setTempGoal} setEditing={setEditing} onSave={onSave} isSaving={isSaving} />}</AnimatePresence>;
}

function WeekEditorPanel({ tempGoal, setTempGoal, setEditing, onSave, isSaving }) {
  return <motion.div className={styles.goalEditorOpen} initial={{ height: 0, opacity: 0, y: -8 }} animate={{ height: "auto", opacity: 1, y: 0 }} exit={{ height: 0, opacity: 0, y: -8 }} transition={WEEK_EDITOR_TRANSITION} style={{ overflow: "hidden" }}><GoalEditor val={tempGoal} onChange={setTempGoal} onSave={onSave} onCancel={() => setEditing(false)} isSaving={isSaving} /></motion.div>;
}

function useWeekGoalState(weekly) {
  const resolvedGoal = weekly?.goal_hours || 20;
  const [tempGoal, setTempGoal] = useState(resolvedGoal);
  const [optimisticGoal, setOptimisticGoal] = useState(resolvedGoal);
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => syncGoals(setTempGoal, setOptimisticGoal, resolvedGoal), [resolvedGoal]);
  return { isSaving, optimisticGoal, resolvedGoal, setIsSaving, setOptimisticGoal, setTempGoal, tempGoal };
}

function syncGoals(setTempGoal, setOptimisticGoal, resolvedGoal) {
  setTempGoal(resolvedGoal);
  setOptimisticGoal(resolvedGoal);
}

function createSaveHandler(goalState, onGoalSave, setEditing) {
  return async (nextGoal) => {
    const previousGoal = goalState.optimisticGoal;
    goalState.setIsSaving(true);
    goalState.setOptimisticGoal(nextGoal);
    try {
      await onGoalSave?.(nextGoal);
      setEditing(false);
    } catch {
      goalState.setOptimisticGoal(previousGoal);
    } finally {
      goalState.setIsSaving(false);
    }
  };
}

export function ThisWeek({ weekly, streaks, onGoalSave, showStreak = true }) {
  const [editing, setEditing] = useState(false);
  const goalState = useWeekGoalState(weekly);
  if (!weekly) return null;
  const displayedWeekly = buildDisplayedWeekly(weekly, goalState.optimisticGoal);
  const handleSave = createSaveHandler(goalState, onGoalSave, setEditing);
  return (
    <Card className={`${styles.glassCard} ${styles.weekCard}`} variant="glass">
      <div className={styles.cardLabel}>THIS WEEK</div>
      <WeekRow weekly={displayedWeekly} streaks={streaks} showStreak={showStreak} editing={editing} setEditing={setEditing} />
      <WeekEditor editing={editing} tempGoal={goalState.tempGoal} setTempGoal={goalState.setTempGoal} setEditing={setEditing} onSave={handleSave} isSaving={goalState.isSaving} />
    </Card>
  );
}
