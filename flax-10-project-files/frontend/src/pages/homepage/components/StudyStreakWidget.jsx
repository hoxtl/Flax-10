<<<<<<< HEAD
/*
 * Study streak summary for completed tasks.
 */

import { useState, useEffect, useMemo } from "react";
import { Flame } from "lucide-react";
import { fetchApi } from "../../../api/client";
import SharedWidgetHeader from "../../../components/common/widget_header/WidgetHeader";
=======
/**
 * StudyStreakWidget
 * Derives streak from taskService completed tasks — counts consecutive days
 * with at least one completed task. Falls back to localStorage for quick read.
 */
import { useState, useEffect, useMemo } from "react";
import { Flame } from "lucide-react";
import { fetchApi } from "../../../api/client";
import baseStyles from "../styles/WidgetBase.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from "../styles/StudyStreakWidget.module.css";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

<<<<<<< HEAD
=======
/** Returns the ISO date string (YYYY-MM-DD) for a given Date */
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

<<<<<<< HEAD
=======
/** Get the last N days' date strings, starting from today, going backwards */
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function lastNDays(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

<<<<<<< HEAD
function calcStreak(activeDates) {
  const set = new Set(activeDates);
  return countBackFromToday(set, 0, new Date());
}

function countBackFromToday(activeDateSet, streak, date) {
  return activeDateSet.has(toDateStr(date))
    ? countBackFromToday(activeDateSet, streak + 1, getPreviousDate(date))
    : streak;
}

function getPreviousDate(date) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return previous;
}

function useCompletedDates() {
=======
/** Calculate streak: count of consecutive days (ending today) with activity */
function calcStreak(activeDates) {
  const set = new Set(activeDates);
  let streak = 0;
  const today = new Date();
  let d = new Date(today);
  while (true) {
    if (set.has(toDateStr(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default function StudyStreakWidget() {
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const [completedDates, setCompletedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
<<<<<<< HEAD
    const state = { cancelled: false };
    loadCompletedDates(state, setCompletedDates, setLoading);
    return () => {
      state.cancelled = true;
    };
  }, []);

  return { completedDates, loading };
}

async function loadCompletedDates(state, setCompletedDates, setLoading) {
  try {
    const data = await fetchApi("/tasks/?completed=true&limit=200");
    setDatesIfActive(state, setCompletedDates, getTaskDates(data));
  } catch {
    setDatesIfActive(state, setCompletedDates, []);
  } finally {
    finishLoadingIfActive(state, setLoading);
  }
}

function setDatesIfActive(state, setCompletedDates, dates) {
  if (!state.cancelled) setCompletedDates(dates);
}

function finishLoadingIfActive(state, setLoading) {
  if (!state.cancelled) setLoading(false);
}

function getTaskDates(data) {
  const tasks = Array.isArray(data) ? data : data?.results ?? [];
  return tasks.filter((task) => task.completed && task.updated_at).map((task) => toDateStr(new Date(task.updated_at)));
}

function getWeekActivity(completedDates) {
  const set = new Set(completedDates);
  return lastNDays(7).map((dateStr) => set.has(dateStr));
}

function getDayLabels() {
  return Array.from({ length: 7 }, (_, index) => getDayLabel(6 - index));
}

function getDayLabel(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  const dayOfWeek = date.getDay();
  return DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
}

function StudyStreakHeader() {
  return <SharedWidgetHeader icon={Flame} title="Study Streak" />;
}

function StudyStreakBars({ dayLabels, week }) {
  return (
    <div className={styles.bars}>
      {week.map((active, index) => (
        <div key={`${dayLabels[index]}-${index}`} className={styles.barCol}>
          <div className={`${styles.bar} ${active ? styles.barActive : ""}`} />
          <span className={styles.barLabel}>{dayLabels[index]}</span>
        </div>
      ))}
    </div>
  );
}

export default function StudyStreakWidget() {
  const { completedDates, loading } = useCompletedDates();
  const streak = useMemo(() => calcStreak(completedDates), [completedDates]);
  const week = useMemo(() => getWeekActivity(completedDates), [completedDates]);
  const dayLabels = useMemo(() => getDayLabels(), []);

  return (
    <div className={styles.root}>
      <StudyStreakHeader />
=======
    let cancelled = false;
    async function load() {
      try {
        // Fetch recently completed tasks (filter last 30 days)
        const data = await fetchApi("/tasks/?completed=true&limit=200");
        const tasks = Array.isArray(data) ? data : (data?.results ?? []);
        const dates = tasks
          .filter(t => t.completed && t.updated_at)
          .map(t => toDateStr(new Date(t.updated_at)));
        if (!cancelled) setCompletedDates(dates);
      } catch {
        if (!cancelled) setCompletedDates([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const streak = useMemo(() => calcStreak(completedDates), [completedDates]);
  const week = useMemo(() => {
    const set = new Set(completedDates);
    return lastNDays(7).map(dateStr => {
      // Get day-of-week (0=Mon through 6=Sun relative to our 7-day window)
      return set.has(dateStr);
    });
  }, [completedDates]);

  // Map 7 days back to Mon-Sun labels
  const dayLabels = useMemo(() => {
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dow = d.getDay(); // 0=Sun, 1=Mon … 6=Sat
      labels.push(DAYS[dow === 0 ? 6 : dow - 1]);
    }
    return labels;
  }, []);

  return (
    <div className={styles.root}>
      <div className={baseStyles.widgetHeader}>
        <div className={baseStyles.headerIconWrap}>
          <Flame size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
        </div>
        <span className={baseStyles.headerTitle}>Study Streak</span>
      </div>

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
      <div className={styles.streakRow}>
        <span className={styles.streakNum}>{loading ? "–" : streak}</span>
        <span className={styles.streakUnit}>day{streak !== 1 ? "s" : ""} 🔥</span>
      </div>
<<<<<<< HEAD
      {streak === 0 && !loading ? <p className={styles.hint}>Complete a task today to start your streak!</p> : null}
      <StudyStreakBars dayLabels={dayLabels} week={week} />
=======

      {streak === 0 && !loading && (
        <p className={styles.hint}>Complete a task today to start your streak!</p>
      )}

      <div className={styles.bars}>
        {week.map((active, i) => (
          <div key={i} className={styles.barCol}>
            <div className={`${styles.bar} ${active ? styles.barActive : ""}`} />
            <span className={styles.barLabel}>{dayLabels[i]}</span>
          </div>
        ))}
      </div>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </div>
  );
}
