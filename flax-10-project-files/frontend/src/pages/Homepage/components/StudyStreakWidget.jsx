/**
 * StudyStreakWidget
 * Derives streak from taskService completed tasks — counts consecutive days
 * with at least one completed task. Falls back to localStorage for quick read.
 */
import { useState, useEffect, useMemo } from "react";
import { Flame } from "lucide-react";
import { fetchApi } from "../../../api/client";
import styles from "../styles/StudyStreakWidget.module.css";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/** Returns the ISO date string (YYYY-MM-DD) for a given Date */
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

/** Get the last N days' date strings, starting from today, going backwards */
function lastNDays(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

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
  const [completedDates, setCompletedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Flame size={15} strokeWidth={1.75} aria-hidden />
        </div>
        <span className={styles.label}>STUDY STREAK</span>
      </div>

      <div className={styles.streakRow}>
        <span className={styles.streakNum}>{loading ? "–" : streak}</span>
        <span className={styles.streakUnit}>day{streak !== 1 ? "s" : ""} 🔥</span>
      </div>

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
    </div>
  );
}
