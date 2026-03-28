/*
 * Personalised society timing insight banner.
 */

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarCheck2, CalendarClock, TimerReset } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "../../common/primary_button/PrimaryButton";

import analyticsApi from "../../../api/analyticsApi";
import { getEnrollments, getModules } from "../../../api/moduleApi";

import styles from "./SocietyInsightBanner.module.css";

const EMPTY_HEATMAP = Array.from({ length: 7 }, () => Array(24).fill(0));

function isValidDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function getUpcomingEvents(society) {
  return (society?.events || [])
    .filter((event) => isValidDate(event?.start_time))
    .sort((left, right) => new Date(left.start_time) - new Date(right.start_time));
}

function getMondayIndex(date) {
  return (date.getDay() + 6) % 7;
}

function toMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatSlot(event) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time || event.start_time);
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(start);
  return `${weekday} ${formatTime(start)} to ${formatTime(end)}`;
}

function getHoursForRange(start, end) {
  const safeEnd = end > start ? end : new Date(start.getTime() + (30 * 60 * 1000));
  const lastHour = safeEnd.getMinutes() > 0 ? safeEnd.getHours() + 1 : safeEnd.getHours();
  const hours = [];
  for (let hour = start.getHours(); hour < Math.max(start.getHours() + 1, Math.min(lastHour, 24)); hour += 1) {
    hours.push(hour);
  }
  return hours;
}

function getHeatmapPeak(heatmap) {
  const values = (heatmap?.data || EMPTY_HEATMAP).flat();
  return values.length ? Math.max(...values) : 0;
}

function hasStudyData(analytics) {
  const summary = analytics?.summary ?? {};
  return Number(summary.total_sessions || 0) > 0 || Number(summary.total_study_hours || 0) > 0;
}

function getEnrolledModules(modules, enrollments) {
  const enrolledIds = new Set((enrollments || []).map((enrollment) => enrollment.module));
  return (modules || []).filter((module) => enrolledIds.has(module.id) && isValidDate(module.start_time));
}

function getEventTimes(event) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time || event.start_time);
  return {
    day: getMondayIndex(start),
    startMinutes: toMinutes(start),
    endMinutes: toMinutes(end),
  };
}

function isTimeConflict(eventTimes, module) {
  const moduleTimes = getEventTimes(module);
  if (eventTimes.day !== moduleTimes.day) return false;
  return eventTimes.startMinutes < moduleTimes.endMinutes && eventTimes.endMinutes > moduleTimes.startMinutes;
}

function findConflictForEvent(event, modules) {
  const eventTimes = getEventTimes(event);
  const conflictModule = modules.find((module) => isTimeConflict(eventTimes, module));
  return conflictModule ? { event, module: conflictModule } : null;
}

function findModuleConflict(events, modules) {
  const conflicts = events.map((event) => findConflictForEvent(event, modules));
  return conflicts.find(Boolean) || null;
}

function isPeakStudyConflict(event, maxMinutes, heatmap) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time || event.start_time);
  const dayRow = heatmap?.data?.[getMondayIndex(start)] || EMPTY_HEATMAP[getMondayIndex(start)];
  const threshold = Math.max(30, maxMinutes * 0.8);
  return getHoursForRange(start, end).some((hour) => dayRow[hour] >= threshold);
}

function findPeakStudyConflict(events, analytics) {
  const maxMinutes = getHeatmapPeak(analytics?.heatmap);
  if (!maxMinutes) return null;
  const event = events.find((evt) => isPeakStudyConflict(evt, maxMinutes, analytics?.heatmap));
  return event ? { event } : null;
}

function buildNoEventsInsight() {
  return {
    tone: "info",
    title: "No society sessions scheduled yet",
    description: "Once this society adds events, we will compare them against your analytics and module timetable.",
    primary: { to: "/calendar", label: "Open Calendar" },
    secondary: { to: "/modules", label: "View Modules" },
    icon: CalendarClock,
  };
}

function buildDoubleConflictInsight(moduleConflict) {
  const slot = formatSlot(moduleConflict.event);
  return {
    tone: "warning",
    title: "This society could squeeze your best study window",
    description: `${moduleConflict.event.title} at ${slot} overlaps with your ${moduleConflict.module.module_code} lecture and one of the hours you study most.`,
    highlight: slot,
    primary: { to: `/modules?moduleId=${moduleConflict.module.id}`, label: `Open ${moduleConflict.module.module_code}` },
    secondary: { to: "/analytics", label: "View Analytics" },
    icon: AlertTriangle,
  };
}

function buildModuleConflictInsight(moduleConflict) {
  const slot = formatSlot(moduleConflict.event);
  return {
    tone: "warning",
    title: "Timetable clash detected",
    description: `${moduleConflict.event.title} at ${slot} overlaps with your ${moduleConflict.module.module_code} lecture.`,
    highlight: slot,
    primary: { to: `/modules?moduleId=${moduleConflict.module.id}`, label: `Open ${moduleConflict.module.module_code}` },
    secondary: { to: "/calendar", label: "Open Calendar" },
    icon: AlertTriangle,
  };
}

function buildStudyPeakConflictInsight(studyPeakConflict) {
  const slot = formatSlot(studyPeakConflict.event);
  return {
    tone: "warning",
    title: "This lands in one of your strongest study slots",
    description: `Based on your analytics, ${studyPeakConflict.event.title} at ${slot} overlaps with a time you usually study most consistently.`,
    highlight: slot,
    primary: { to: "/analytics", label: "View Analytics" },
    secondary: { to: "/calendar", label: "Open Calendar" },
    icon: AlertTriangle,
  };
}

function buildNoDataInsight() {
  return {
    tone: "info",
    title: "We can personalise this once you use Timer",
    description: "Track a few study sessions and we will compare this society's meeting times against your focus heatmap and module timetable.",
    primary: { to: "/timer", label: "Open Timer" },
    secondary: { to: "/modules", label: "View Modules" },
    icon: TimerReset,
  };
}

function buildSuccessInsight(hasExtendedContext) {
  return {
    tone: "positive",
    title: "This looks like a good fit for your week",
    description: hasExtendedContext
      ? "Upcoming sessions sit outside your busiest study hours and we did not spot a clash with your enrolled modules."
      : "Upcoming sessions sit outside your busiest study hours, so they should fit more comfortably around your usual routine.",
    primary: { to: "/analytics", label: "View Analytics" },
    secondary: { to: "/calendar", label: "Open Calendar" },
    icon: CalendarCheck2,
  };
}

function buildInsight({ analytics, events, modules, moduleContextAvailable }) {
  if (!events.length) return buildNoEventsInsight();
  const moduleConflict = moduleContextAvailable ? findModuleConflict(events, modules) : null;
  const studyPeakConflict = hasStudyData(analytics) ? findPeakStudyConflict(events, analytics) : null;
  if (moduleConflict && studyPeakConflict) return buildDoubleConflictInsight(moduleConflict);
  if (moduleConflict) return buildModuleConflictInsight(moduleConflict);
  if (studyPeakConflict) return buildStudyPeakConflictInsight(studyPeakConflict);
  if (!hasStudyData(analytics)) return buildNoDataInsight();
  return buildSuccessInsight(moduleContextAvailable && modules.length);
}

function getFulfilledValue(result, fallback) {
  return result.status === "fulfilled" ? result.value : fallback;
}

async function loadSocietyInsightData() {
  return Promise.allSettled([analyticsApi.getSummary(30), getModules(), getEnrollments()]);
}

function getInsightParams(res, society) {
  const [a, m, e] = res;
  return {
    analytics: getFulfilledValue(a, null),
    events: getUpcomingEvents(society),
    modules: getEnrolledModules(getFulfilledValue(m, []), getFulfilledValue(e, [])),
    moduleContextAvailable: m.status === "fulfilled" && e.status === "fulfilled",
  };
}

function InsightText({ insight }) {
  if (!insight.highlight || !insight.description.includes(insight.highlight)) {
    return (
      <>
        <strong>{insight.title}</strong> — {insight.description}
      </>
    );
  }

  const [before, after] = insight.description.split(insight.highlight, 2);
  return (
    <>
      <strong>{insight.title}</strong> — {before}
      <span className={styles.highlight}>{insight.highlight}</span>
      {after}
    </>
  );
}

function useSocietyInsight(society) {
  const [insight, setInsight] = useState(null);
  const sig = useMemo(() => (society?.events || []).map((ev) => `${ev.id}:${ev.start_time}:${ev.end_time}`).join("|"), [society?.events]);
  useEffect(() => {
    let cancelled = false;
    loadSocietyInsightData().then((res) => {
      if (!cancelled) setInsight(buildInsight(getInsightParams(res, society)));
    }).catch(() => {
      if (!cancelled) setInsight(buildInsight({ analytics: null, events: getUpcomingEvents(society), modules: [], moduleContextAvailable: false }));
    });
    return () => { cancelled = true; };
  }, [society?.id, sig]);
  return insight;
}

export default function SocietyInsightBanner({ society }) {
  const insight = useSocietyInsight(society);
  const navigate = useNavigate();
  if (!insight) return null;

  const Icon = insight.icon;
  return (
    <div className={`${styles.banner} ${styles[insight.tone]}`} aria-live="polite">
      <Icon className={styles.icon} size={17} strokeWidth={2.1} />
      <span className={styles.text}>
        <InsightText insight={insight} />
      </span>
      <div className={styles.actions}>
        <PrimaryButton size="small" pill onClick={() => navigate(insight.primary.to)}>
          {insight.primary.label}
        </PrimaryButton>
        <PrimaryButton size="small" pill variant="secondary" onClick={() => navigate(insight.secondary.to)}>
          {insight.secondary.label}
        </PrimaryButton>
      </div>
    </div>
  );
}
