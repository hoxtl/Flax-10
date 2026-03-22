/**
 * Intelligence dashboard state.
 */

import { useEffect, useMemo, useState } from "react";
import { tflService } from "../../../api/tflApi";
import { getMyCourseChangeRequest } from "../../../api/adminApi";
import { updateUserSettings } from "../../../api/userApi";
import { loadTermConfig } from "../../../lib/termConfig";
import { getCurrentEvent, getLiveContext, getNextStep, getUpcomingEvent } from "../components/IntelligenceUtils";
import { getRelevantDelays, isSevereDisruption } from "../utils/kclTflMapping";
import useAnalyticsOverview from "../../Analytics/hooks/useAnalyticsOverview";

export const CATALOGUE = [
  { id: "hero", label: "Intelligence Hero", icon: "✨", col: 2, row: 2, minRow: 2, maxRow: 2, section: "Essentials" },
  { id: "rightNow", label: "Right Now", icon: "⌚", col: 1, row: 2, section: "Essentials" },
  { id: "deadlines", label: "Deadlines", icon: "⏰", col: 1, row: 1, maxRow: 2, section: "Planning" },
  { id: "todayTasks", label: "Today's Tasks", icon: "✅", col: 1, row: 1, maxRow: 1, section: "Planning" },
  { id: "tinyTimeline", label: "Tiny Timeline", icon: "🕒", col: 1, row: 2, maxRow: 2, section: "Planning" },
  { id: "bigTimeline", label: "Full Timeline", icon: "🗓️", col: 2, row: 2, minCol: 2, maxCol: 2, minRow: 2, maxRow: 2, section: "Planning" },
  { id: "semesterOverview", label: "Semester Overview", icon: "📅", col: 2, row: 2, minRow: 2, section: "Planning" },
  { id: "studyStreak", label: "Study Streak", icon: "🔥", col: 1, row: 1, section: "Progress" },
  { id: "weeklyGoal", label: "Weekly Goal", icon: "🎯", col: 1, row: 1, section: "Progress" },
  { id: "photo", label: "Photo", icon: "🖼️", col: 1, row: 1, section: "Profile" },
  { id: "analyticsProductivity", label: "Productivity", icon: "⚙️", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsInsights", label: "Insights", icon: "💡", col: 1, row: 1, section: "Analytics" },
  { id: "analyticsDailyBreakdown", label: "Daily Breakdown", icon: "📊", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsHeatmap", label: "Focus Heatmap", icon: "🟩", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsAttendance", label: "Attendance", icon: "📋", col: 2, row: 2, minRow: 2, section: "Analytics" },
];

const DEFAULT_LAYOUT = ["hero", "deadlines", "todayTasks", "bigTimeline"];
const CATALOGUE_IDS = new Set(CATALOGUE.map((widget) => widget.id));

export function useIntelligenceDashboard(props) {
  const [layout, setLayout] = usePersistedLayout(props.profile);
  const [widgetSizes, setWidgetSizes] = usePersistedWidgetSizes(props.profile);
  const ui = useDashboardUiState();
  const tflDelays = useTflDelays();
  const courseChangeRequest = useCourseChangeRequest();
  const teacherRequestPending = props.profile?.role === "pending_teacher";
  const hasAnalyticsWidgets = layout.some((id) => id.startsWith("analytics"));
  const analytics = useAnalyticsOverview(hasAnalyticsWidgets ? 30 : null);
  const live = useLiveSummary(props, tflDelays);
  useCloudSync(props.profile, props.profileLoading, layout, widgetSizes);
  useProfileFallback(props.profile, props.profileLoading, setLayout, setWidgetSizes);
  return buildDashboardState(analytics, courseChangeRequest, layout, live, setLayout, teacherRequestPending, tflDelays, ui, widgetSizes, setWidgetSizes);
}

function usePersistedLayout(profile) {
  const [layout, setLayout] = useState(() => readStoredLayout(profile));
  useEffect(() => writeStoredValue(getStorageKeys(profile?.id).layout, layout), [layout, profile?.id]);
  return [layout, setLayout];
}

function usePersistedWidgetSizes(profile) {
  const [widgetSizes, setWidgetSizes] = useState(() => readStoredWidgetSizes(profile));
  useEffect(() => writeStoredValue(getStorageKeys(profile?.id).sizes, widgetSizes), [profile?.id, widgetSizes]);
  return [widgetSizes, setWidgetSizes];
}

function useTflDelays() {
  const [delays, setDelays] = useState([]);
  useEffect(() => { tflService.getTfLDelays().then((data) => setDelays(Array.isArray(data) ? data : [])).catch(() => setDelays([])); }, []);
  return delays;
}

function useCourseChangeRequest() {
  const [request, setRequest] = useState(null);
  useEffect(() => { getMyCourseChangeRequest().then((data) => setRequest(isPendingCourseChange(data) ? data : null)).catch(() => setRequest(null)); }, []);
  return request;
}

function useProfileFallback(profile, profileLoading, setLayout, setWidgetSizes) {
  useEffect(() => syncProfileSettings(profile, profileLoading, setLayout, setWidgetSizes), [profile, profileLoading, setLayout, setWidgetSizes]);
}

function useCloudSync(profile, profileLoading, layout, widgetSizes) {
  useEffect(() => scheduleCloudSync(profile, profileLoading, layout, widgetSizes), [layout, profile, profileLoading, widgetSizes]);
}

function useLiveSummary(props, tflDelays) {
  return useMemo(() => buildLiveSummary(props, tflDelays), [props, tflDelays]);
}

function buildLiveSummary(props, tflDelays) {
  const sortedEvents = Array.isArray(props.slot5Data?.sortedEvents) ? props.slot5Data.sortedEvents : [];
  const pendingTasks = (props.slot5Data?.taskWidgetItemsOnly || []).filter((task) => !task.completed);
  const currentEvent = getCurrentEvent(sortedEvents, props.slot5Data?.now ?? new Date());
  const upcomingEvent = getUpcomingEvent(sortedEvents, props.slot5Data?.now ?? new Date());
  return {
    currentStreak: getCurrentStreak(props.profileLoading, props.profile),
    eventsCount: sortedEvents.length,
    liveContext: getLiveContext({ currentEvent, upcomingEvent, overlaps: props.slot5Data?.navigatorContext?.overlaps, tflDelays, now: props.slot5Data?.now ?? new Date(), getRelevantDelays, isSevereDisruption }),
    nextStep: props.recommendation?.text || getNextStep({ tasksCount: pendingTasks.length, nextWindowMeta: null }),
    nextStepMeta: props.recommendation?.meta || null,
    tasksCount: pendingTasks.length,
    weeklyProgress: getWeeklyProgress(props.profileLoading, props.profile),
  };
}

function getCurrentStreak(profileLoading, profile) {
  const current = profileLoading ? null : profile?.summary?.streaks?.current;
  return Number.isFinite(current) && current > 0 ? `${current}-day streak` : null;
}

function getWeeklyProgress(profileLoading, profile) {
  const weekly = profileLoading ? null : profile?.summary?.weekly?.percentage;
  return Number.isFinite(weekly) ? `${Math.round(weekly)}% weekly goal` : null;
}

function getStorageKeys(userId) {
  return { layout: userId ? `homepage_widget_layout_${userId}` : "homepage_widget_layout", sizes: userId ? `homepage_widget_sizes_${userId}` : "homepage_widget_sizes" };
}

function readStoredLayout(profile) {
  return sanitizeLayout(readStoredValue(getStorageKeys(profile?.id).layout) || profile?.settings?.homepage_widgets || DEFAULT_LAYOUT);
}

function readStoredWidgetSizes(profile) {
  return readStoredValue(getStorageKeys(profile?.id).sizes) || profile?.settings?.homepage_widget_sizes || {};
}

function readStoredValue(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null");
  } catch {
    return null;
  }
}

function writeStoredValue(storageKey, value) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

function sanitizeLayout(layout) {
  return (Array.isArray(layout) ? layout : DEFAULT_LAYOUT).filter((id) => CATALOGUE_IDS.has(id));
}

function randomizeLayout(prev) {
  const pinned = prev.includes("hero") ? ["hero"] : [];
  const shuffled = prev.filter((id) => id !== "hero").sort(() => 0.5 - Math.random());
  return [...pinned, ...shuffled];
}

function isPendingCourseChange(data) {
  const status = String(data?.status || "").toLowerCase();
  return status === "pending" || (data?.requested_course && status !== "approved" && status !== "rejected");
}

function syncProfileSettings(profile, profileLoading, setLayout, setWidgetSizes) {
  if (profileLoading || !profile?.settings) return;
  if (localStorage.getItem(getStorageKeys(profile.id).layout)) return;
  if (!profile.settings.homepage_widgets?.length) return;
  setLayout(profile.settings.homepage_widgets);
  if (profile.settings.homepage_widget_sizes) setWidgetSizes(profile.settings.homepage_widget_sizes);
}

function scheduleCloudSync(profile, profileLoading, layout, widgetSizes) {
  if (profileLoading || !profile?.id) return;
  const timer = setTimeout(() => {
    updateUserSettings({ homepage_widgets: layout, homepage_widget_sizes: widgetSizes }).catch(() => {});
  }, 2000);
  return () => clearTimeout(timer);
}

function useDashboardUiState() {
  const [edit, setEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCourseChange, setShowCourseChange] = useState(true);
  const [showTeacherRequest, setShowTeacherRequest] = useState(true);
  return { edit, setEdit, setShowAdd, setShowCourseChange, setShowResetConfirm, setShowTeacherRequest, showAdd, showCourseChange, showResetConfirm, showTeacherRequest };
}

function buildDashboardState(analytics, courseChangeRequest, layout, live, setLayout, teacherRequestPending, tflDelays, ui, widgetSizes, setWidgetSizes) {
  return { ...getDashboardData(analytics, courseChangeRequest, layout, live, teacherRequestPending, tflDelays, ui, widgetSizes), ...getDashboardActions(setLayout, setWidgetSizes, ui) };
}

function getDashboardActions(setLayout, setWidgetSizes, ui) {
  return { handleRandomize: () => setLayout(randomizeLayout), handleReset: () => ui.setShowResetConfirm(true), setEdit: ui.setEdit, setLayout, setShowAdd: ui.setShowAdd, setShowCourseChange: ui.setShowCourseChange, setShowResetConfirm: ui.setShowResetConfirm, setShowTeacherRequest: ui.setShowTeacherRequest, setWidgetSize: (id, size) => setWidgetSizes((prev) => ({ ...prev, [id]: size })) };
}

function getDashboardData(analytics, courseChangeRequest, layout, live, teacherRequestPending, tflDelays, ui, widgetSizes) {
  return { analytics, courseChangeRequest: ui.showCourseChange ? courseChangeRequest : null, edit: ui.edit, layout, live, showAdd: ui.showAdd, showResetConfirm: ui.showResetConfirm, teacherRequestPending: ui.showTeacherRequest ? teacherRequestPending : false, tflDelays, widgetSizes };
}

export function getSemesterProgress(now = new Date()) {
  const config = loadTermConfig();
  const startDate = new Date(config?.startDate);
  if (Number.isNaN(startDate.getTime())) return null;
  startDate.setHours(0, 0, 0, 0);
  const totalWeeks = Math.max(1, Number(config?.totalWeeks || 0) + (config?.hasReadingWeek ? 1 : 0));
  const totalDays = totalWeeks * 7;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return buildSemesterProgress(startDate, today, totalDays);
}

function buildSemesterProgress(startDate, today, totalDays) {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays - 1);
  const elapsedDays = Math.floor((today - startDate) / 86400000);
  const pct = Math.round((Math.min(Math.max(elapsedDays + 1, 0), totalDays) / totalDays) * 100);
  return { hasStarted: today >= startDate, isFinished: today > endDate, pct };
}
