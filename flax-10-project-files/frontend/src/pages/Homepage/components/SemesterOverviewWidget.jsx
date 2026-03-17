/**
 * SemesterOverviewWidget — shows the full academic term at a glance.
 * 
 * Data: self-fetches ALL calendar events across the semester date range
 *       using the /api/events/?start=&end= endpoint. Also uses
 *       upcomingDeadlines from Deadlines API for coursework/assessment rows.
 *
 * Each week column shows stacked density bars by type:
 *   🟢 Lectures   (timetable / lecture / seminar / tutorial / lab)
 *   🟠 Deadlines  (from upcomingDeadlines)
 *   🟣 Exams      (events whose title contains "exam" / "assessment")
 */

import { useMemo, useEffect, useState, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import { getEvents } from "../../../api/eventApi";
import { getUpcomingDeadlines } from "../../../api/deadlineApi";
import styles from "../styles/SemesterOverview.module.css";

// ─── helpers ──────────────────────────────────────────────────────────────────

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
  return Array.from({ length: numWeeks }, (_, i) => {
    const weekStart = addWeeks(semStart, i);
    const weekEnd   = addWeeks(semStart, i + 1);
    const isReading = readingSet.has(i);

    let lectureCount  = 0;
    let examCount     = 0;
    let deadlineCount = 0;

    (events || []).forEach((ev) => {
      const t = new Date(ev.start_time || ev.date);
      if (isNaN(t) || t < weekStart || t >= weekEnd) return;
      const kind = classifyEvent(ev);
      if (kind === "lecture") lectureCount++;
      else if (kind === "exam") examCount++;
    });

    (deadlines || []).forEach((dl) => {
      const t = new Date(dl.start_due_date || dl.due_date || dl.date);
      if (isNaN(t) || t < weekStart || t >= weekEnd) return;
      deadlineCount++;
    });

    return {
      index:         i,
      label:         isReading ? "RW" : `W${i + 1}`,
      dateLabel:     fmt(weekStart),
      isCurrent:     now >= weekStart && now < weekEnd,
      isPast:        now >= weekEnd,
      isReading,
      lectureCount,
      deadlineCount,
      examCount,
    };
  });
}

function toHeight(count, maxCount, maxPx = 40, minPx = 4) {
  if (!count) return 0;
  return Math.round(minPx + (Math.min(count / Math.max(maxCount, 1), 1)) * (maxPx - minPx));
}

// ─── component ────────────────────────────────────────────────────────────────

export default function SemesterOverviewWidget({
  semesterStart   = null,   // ISO date string — first day of term
  numWeeks        = 12,
  readingWeekIndices = [],  // 0-based, e.g. [4] = week 5
  semesterLabel   = "Semester · 2025/26",
}) {
  const now = new Date();

  const semStart = useMemo(() => {
    if (semesterStart) return getMonday(new Date(semesterStart));
    // Fallback: go back to the Monday ~(numWeeks/2) weeks ago
    const approx = new Date(now);
    approx.setDate(approx.getDate() - Math.floor(numWeeks / 2) * 7);
    return getMonday(approx);
  }, [semesterStart, numWeeks]);

  const semEnd = useMemo(() => addWeeks(semStart, numWeeks), [semStart, numWeeks]);

  // ── Fetch events for the full semester range ─────────────────────────────
  const [events,    setEvents]    = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const startStr = semStart.toISOString().slice(0, 10);
      const endStr   = semEnd.toISOString().slice(0, 10);

      const [evData, dlData] = await Promise.all([
        getEvents({ start: startStr, end: endStr }),
        getUpcomingDeadlines().catch(() => []),
      ]);

      setEvents(Array.isArray(evData) ? evData : []);
      setDeadlines(Array.isArray(dlData) ? dlData : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [semStart, semEnd]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Build week structure ─────────────────────────────────────────────────
  const weeks = useMemo(
    () => buildWeeks(semStart, numWeeks, readingWeekIndices, events, deadlines, now),
    [semStart, numWeeks, readingWeekIndices, events, deadlines]
  );

  const maxLecture  = Math.max(...weeks.map((w) => w.lectureCount),  1);
  const maxDeadline = Math.max(...weeks.map((w) => w.deadlineCount), 1);
  const maxExam     = Math.max(...weeks.map((w) => w.examCount),     1);

  // Detect heavy deadline weeks (≥ 70% of the busiest deadline week)
  const clusterWeeks = weeks.filter((w) => w.deadlineCount >= Math.max(maxDeadline * 0.7, 2));
  const hasCluster   = clusterWeeks.length > 0;

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrap}>
              <CalendarDays size={16} strokeWidth={1.75} aria-hidden />
            </div>
            <div className={styles.titleBlock}>
              <h3 className={styles.title}>SEMESTER OVERVIEW</h3>
              <span className={styles.subtitle}>{semesterLabel}</span>
            </div>
          </div>
        </div>
        <div className={styles.loadingRow}>
          {Array.from({ length: numWeeks }).map((_, i) => (
            <div key={i} className={`${styles.weekCol} ${styles.skeletonCol}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.iconWrap}>
            <CalendarDays size={16} strokeWidth={1.75} aria-hidden />
          </div>
          <div className={styles.titleBlock}>
            <h3 className={styles.title}>SEMESTER OVERVIEW</h3>
            <span className={styles.subtitle}>{semesterLabel}</span>
          </div>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotLecture}`} /> Lectures
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotDeadline}`} /> Deadlines
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotExam}`} /> Exams
          </span>
        </div>
      </div>

      {/* Week columns */}
      <div className={styles.grid}>
        {weeks.map((w) => {
          const lh = toHeight(w.lectureCount,  maxLecture);
          const dh = toHeight(w.deadlineCount, maxDeadline);
          const eh = toHeight(w.examCount,     maxExam);

          return (
            <div
              key={w.index}
              className={[
                styles.weekCol,
                w.isCurrent ? styles.currentCol : "",
                w.isPast    ? styles.pastCol    : "",
                w.isReading ? styles.readingCol : "",
              ].filter(Boolean).join(" ")}
              title={`${w.label}: ${w.lectureCount} lecture${w.lectureCount !== 1 ? "s" : ""}, ${w.deadlineCount} deadline${w.deadlineCount !== 1 ? "s" : ""}, ${w.examCount} exam${w.examCount !== 1 ? "s" : ""}`}
            >
              <div className={styles.weekNum}>{w.label}{w.isCurrent ? " ←" : ""}</div>
              <div className={styles.bars}>
                {lh > 0 && <div className={`${styles.bar} ${styles.barLecture}`}  style={{ height: lh }} />}
                {dh > 0 && <div className={`${styles.bar} ${styles.barDeadline}`} style={{ height: dh }} />}
                {eh > 0 && <div className={`${styles.bar} ${styles.barExam}`}     style={{ height: eh }} />}
                {!lh && !dh && !eh && w.isReading && (
                  <div className={`${styles.bar} ${styles.barReading}`} style={{ height: 14 }} />
                )}
              </div>
              <div className={styles.dateLabel}>{w.dateLabel}</div>
            </div>
          );
        })}
      </div>

      {/* Auto-generated cluster warning */}
      {hasCluster && (
        <div className={styles.clusterWarning}>
          <span className={styles.clusterIcon}>⚠️</span>
          <span>
            <strong className={styles.clusterHighlight}>
              Deadline cluster in {clusterWeeks.map((w) => w.label).join("–")}
            </strong>
            {" — "}
            {clusterWeeks.reduce((s, w) => s + w.deadlineCount, 0)} deadline
            {clusterWeeks.reduce((s, w) => s + w.deadlineCount, 0) !== 1 ? "s" : ""}
            {clusterWeeks.some((w) => w.examCount > 0) &&
              ` + ${clusterWeeks.reduce((s, w) => s + w.examCount, 0)} exam${clusterWeeks.reduce((s, w) => s + w.examCount, 0) !== 1 ? "s" : ""}`}
            . Consider planning revision sessions earlier.
          </span>
        </div>
      )}
    </div>
  );
}
