/*
 * Semester overview widget for term pacing and deadline density.
 */

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import SharedWidgetHeader from "../../../components/common/widget_header/WidgetHeader";
import styles from "../styles/SemesterOverview.module.css";
import { useSemesterData, useSemesterRange } from "./useSemesterOverviewData";

// Helpers

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + 7 * n);
  return d;
}

function fmt(date) {
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function classifyEvent(ev) {
  const title = (ev?.title || "").toLowerCase();
  if (
    title.includes("exam") ||
    (title.includes("final") && title.includes("assessment"))
  )
    return "exam";
  if (
    ev?.source === "timetable" ||
    title.includes("lecture") ||
    title.includes("seminar") ||
    title.includes("tutorial") ||
    title.includes("lab")
  )
    return "lecture";
  return "other";
}

function buildWeeks(semStart, numWeeks, readingWeekIndices, events, deadlines, now) {
  const readingSet = new Set(readingWeekIndices);
  return Array.from({ length: numWeeks }, (_, index) => buildWeek(semStart, index, readingSet, events, deadlines, now));
}

function toHeight(count, maxCount, maxPx = 40, minPx = 4) {
  if (!count) return 0;
  return Math.round(minPx + (Math.min(count / Math.max(maxCount, 1), 1)) * (maxPx - minPx));
}

// Component

export default function SemesterOverviewWidget({
  semesterStart   = null,   // ISO date string — first day of term
  numWeeks        = 12,
  readingWeekIndices = [],  // 0-based, e.g. [4] = week 5
  semesterLabel   = "Semester · 2025/26",
  row             = 2,
}) {
  const { now, semStart, semEnd } = useSemesterRange(semesterStart, numWeeks);
  const { deadlines, events, loading } = useSemesterData(semStart, semEnd);
  const weeks = useSemesterWeeks({ deadlines, events, now, numWeeks, readingWeekIndices, semStart });
  const maxima = getWeekMaxima(weeks);
  const clusterWeeks = getClusterWeeks(weeks, maxima.maxDeadline);
  if (loading) return <SemesterOverviewLoading numWeeks={numWeeks} semesterLabel={semesterLabel} />;
  return <SemesterOverviewBody clusterWeeks={clusterWeeks} maxima={maxima} row={row} semesterLabel={semesterLabel} weeks={weeks} />;
}

function buildWeek(semStart, index, readingSet, events, deadlines, now) {
  const weekStart = addWeeks(semStart, index);
  const weekEnd = addWeeks(semStart, index + 1);
  const counts = getWeekCounts(events, deadlines, weekStart, weekEnd);
  return {
    index,
    label: readingSet.has(index) ? "RW" : `W${index + 1}`,
    dateLabel: fmt(weekStart),
    isCurrent: now >= weekStart && now < weekEnd,
    isPast: now >= weekEnd,
    isReading: readingSet.has(index),
    ...counts,
  };
}

function getWeekCounts(events, deadlines, weekStart, weekEnd) {
  return {
    deadlineCount: countDeadlines(deadlines, weekStart, weekEnd),
    examCount: countEventsByKind(events, weekStart, weekEnd, "exam"),
    lectureCount: countEventsByKind(events, weekStart, weekEnd, "lecture"),
  };
}

function countEventsByKind(events, weekStart, weekEnd, kind) {
  return (events || []).filter((event) => isWeekDate(event.start_time || event.date, weekStart, weekEnd)).filter((event) => classifyEvent(event) === kind).length;
}

function countDeadlines(deadlines, weekStart, weekEnd) {
  return (deadlines || []).filter((deadline) => isWeekDate(deadline.start_due_date || deadline.due_date || deadline.date, weekStart, weekEnd)).length;
}

function isWeekDate(value, weekStart, weekEnd) {
  const time = new Date(value);
  return !Number.isNaN(time) && time >= weekStart && time < weekEnd;
}

function useSemesterWeeks({ deadlines, events, now, numWeeks, readingWeekIndices, semStart }) {
  return useMemo(() => buildWeeks(semStart, numWeeks, readingWeekIndices, events, deadlines, now), [deadlines, events, now, numWeeks, readingWeekIndices, semStart]);
}

function getWeekMaxima(weeks) {
  return {
    maxDeadline: Math.max(...weeks.map((week) => week.deadlineCount), 1),
    maxExam: Math.max(...weeks.map((week) => week.examCount), 1),
    maxLecture: Math.max(...weeks.map((week) => week.lectureCount), 1),
  };
}

function getClusterWeeks(weeks, maxDeadline) {
  return weeks.filter((week) => week.deadlineCount >= Math.max(maxDeadline * 0.7, 2));
}

function SemesterOverviewLoading({ numWeeks, semesterLabel }) {
  return (
    <div className={styles.root}>
      <SemesterOverviewHeader semesterLabel={semesterLabel} />
      <div className={styles.loadingRow}>{Array.from({ length: numWeeks }).map((_, index) => <div key={index} className={`${styles.weekCol} ${styles.skeletonCol}`} />)}</div>
    </div>
  );
}

function SemesterOverviewBody({ clusterWeeks, maxima, row, semesterLabel, weeks }) {
  return (
    <div className={`${styles.root} ${row === 1 ? styles.h1 : styles.h2}`}>
      <SemesterOverviewHeader semesterLabel={semesterLabel} />
      <SemesterWeekGrid maxima={maxima} row={row} weeks={weeks} />
      <SemesterClusterWarning clusterWeeks={clusterWeeks} />
    </div>
  );
}

function SemesterOverviewHeader({ semesterLabel }) {
  return (
    <SharedWidgetHeader actions={<SemesterLegend />} icon={CalendarDays} meta={semesterLabel} title="Semester Overview" />
  );
}

function SemesterLegend() {
  return (
    <div className={styles.legend}>
      <LegendItem className={styles.dotLecture} label="Lectures" />
      <LegendItem className={styles.dotDeadline} label="Deadlines" />
      <LegendItem className={styles.dotExam} label="Exams" />
    </div>
  );
}

function LegendItem({ className, label }) {
  return <span className={styles.legendItem}><span className={`${styles.legendDot} ${className}`} /> {label}</span>;
}

function SemesterWeekGrid({ maxima, row, weeks }) {
  return <div className={styles.grid}>{weeks.map((week) => <SemesterWeekColumn key={week.index} maxBarHeight={row === 1 ? 36 : 84} maxima={maxima} week={week} />)}</div>;
}

function SemesterWeekColumn({ maxBarHeight, maxima, week }) {
  const heights = getWeekHeights(week, maxima, maxBarHeight);
  return (
    <div className={getWeekClassName(week)} title={getWeekTitle(week)}>
      <div className={styles.weekNum}>{week.label}{week.isCurrent ? " ←" : ""}</div>
      <SemesterWeekBars heights={heights} isReading={week.isReading} />
      <div className={styles.dateLabel}>{week.dateLabel}</div>
    </div>
  );
}

function getWeekHeights(week, maxima, maxBarHeight) {
  return {
    deadline: toHeight(week.deadlineCount, maxima.maxDeadline, maxBarHeight),
    exam: toHeight(week.examCount, maxima.maxExam, maxBarHeight),
    lecture: toHeight(week.lectureCount, maxima.maxLecture, maxBarHeight),
  };
}

function getWeekClassName(week) {
  return [styles.weekCol, week.isCurrent ? styles.currentCol : "", week.isPast ? styles.pastCol : "", week.isReading ? styles.readingCol : ""].filter(Boolean).join(" ");
}

function getWeekTitle(week) {
  return `${week.label}: ${week.lectureCount} lecture${week.lectureCount !== 1 ? "s" : ""}, ${week.deadlineCount} deadline${week.deadlineCount !== 1 ? "s" : ""}, ${week.examCount} exam${week.examCount !== 1 ? "s" : ""}`;
}

function SemesterWeekBars({ heights, isReading }) {
  return (
    <div className={styles.bars}>
      {heights.lecture > 0 ? <div className={`${styles.bar} ${styles.barLecture}`} style={{ height: heights.lecture }} /> : null}
      {heights.deadline > 0 ? <div className={`${styles.bar} ${styles.barDeadline}`} style={{ height: heights.deadline }} /> : null}
      {heights.exam > 0 ? <div className={`${styles.bar} ${styles.barExam}`} style={{ height: heights.exam }} /> : null}
      {!heights.lecture && !heights.deadline && !heights.exam && isReading ? <div className={`${styles.bar} ${styles.barReading}`} style={{ height: 14 }} /> : null}
    </div>
  );
}

function SemesterClusterWarning({ clusterWeeks }) {
  if (!clusterWeeks.length) return null;
  return (
    <div className={styles.clusterWarning}>
      <span className={styles.clusterIcon}>⚠️</span>
      <span><strong className={styles.clusterHighlight}>Deadline cluster in {clusterWeeks.map((week) => week.label).join("–")}</strong>{" — "}{getClusterSummary(clusterWeeks)}. Consider planning revision sessions earlier.</span>
    </div>
  );
}

function getClusterSummary(clusterWeeks) {
  const deadlineCount = clusterWeeks.reduce((sum, week) => sum + week.deadlineCount, 0);
  const examCount = clusterWeeks.reduce((sum, week) => sum + week.examCount, 0);
  const examLabel = examCount ? ` + ${examCount} exam${examCount !== 1 ? "s" : ""}` : "";
  return `${deadlineCount} deadline${deadlineCount !== 1 ? "s" : ""}${examLabel}`;
}
