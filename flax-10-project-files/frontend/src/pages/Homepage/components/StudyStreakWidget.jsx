/*
 * Study streak summary for completed tasks.
 */

import { useState, useEffect, useMemo } from "react";
import { Flame } from "lucide-react";
import { fetchApi } from "../../../api/client";
import SharedWidgetHeader from "../../../components/Common/WidgetHeader/WidgetHeader";
import styles from "../styles/StudyStreakWidget.module.css";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
}

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
  const [completedDates, setCompletedDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      <div className={styles.streakRow}>
        <span className={styles.streakNum}>{loading ? "–" : streak}</span>
        <span className={styles.streakUnit}>day{streak !== 1 ? "s" : ""} 🔥</span>
      </div>
      {streak === 0 && !loading ? <p className={styles.hint}>Complete a task today to start your streak!</p> : null}
      <StudyStreakBars dayLabels={dayLabels} week={week} />
    </div>
  );
}
