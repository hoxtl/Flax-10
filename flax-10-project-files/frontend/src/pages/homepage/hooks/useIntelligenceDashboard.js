/**
 * Intelligence dashboard state.
 */

import { useEffect, useMemo, useState } from "react";
import { tflService } from "../../../api/tflApi";
import { getMyCourseChangeRequest } from "../../../api/adminApi";
import { updateUserSettings } from "../../../api/userApi";
import useAttendanceStats from "../../../components/analytics/hooks/useAttendanceStats";
import { getAttendancePercentage } from "../../../components/analytics/utils/attendanceChartConfig";
import { loadTermConfig } from "../../../lib/termConfig";
import { getCurrentEvent, getLiveContext, getUpcomingEvent } from "../components/IntelligenceUtils";
import { getRelevantDelays, isSevereDisruption } from "../utils/kclTflMapping";
import useAnalyticsOverview from "../../analytics/hooks/useAnalyticsOverview";

export const CATALOGUE = [
  { id: "hero", label: "Intelligence Hero", icon: "✨", col: 2, row: 1, minRow: 1, maxRow: 1, section: "Essentials" },
  { id: "rightNow", label: "Right Now", icon: "⌚", col: 1, row: 2, section: "Essentials" },
  { id: "deadlines", label: "Deadlines", icon: "⏰", col: 1, row: 1, maxRow: 2, section: "Planning" },
  { id: "todayTasks", label: "Today's Tasks", icon: "✅", col: 1, row: 1, maxRow: 1, section: "Planning" },
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

export const DEFAULT_LAYOUT = ["hero", "deadlines", "todayTasks", "bigTimeline"];
const CATALOGUE_IDS = new Set(CATALOGUE.map((widget) => widget.id));
const HERO_ID = "hero";

export function useIntelligenceDashboard(props) {
  const [layout, setLayout] = usePersistedLayout(props.profile);
  const [widgetSizes, setWidgetSizes] = usePersistedWidgetSizes(props.profile);
  const ui = useDashboardUiState();
  const tflDelays = useTflDelays();
  const courseChangeRequest = useCourseChangeRequest();
  const hasAnalyticsWidgets = layout.some((id) => id.startsWith("analytics"));
  const analytics = useAnalyticsOverview(hasAnalyticsWidgets ? 30 : null);
  const attendance = useAttendanceSummary();
  const live = useLiveSummary(props, tflDelays);
  useCloudSync(props.profile, props.profileLoading, layout, widgetSizes);
  useProfileFallback(props.profile, props.profileLoading, setLayout, setWidgetSizes);
  return buildDashboardState(analytics, attendance, courseChangeRequest, layout, live, setLayout, tflDelays, ui, widgetSizes, setWidgetSizes);
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

function useAttendanceSummary() {
  const { loading, stats } = useAttendanceStats();
  return { loading, pct: stats?.overall ? getAttendancePercentage(stats.overall) : 0 };
}

function buildLiveSummary(props, tflDelays) {
  const sortedEvents = Array.isArray(props.slot5Data?.sortedEvents) ? props.slot5Data.sortedEvents : [];
  const pendingTasks = (props.slot5Data?.taskWidgetItemsOnly || []).filter((task) => !task.completed);
  const currentEvent = getCurrentEvent(sortedEvents, props.slot5Data?.now ?? new Date());
  const upcomingEvent = getUpcomingEvent(sortedEvents, props.slot5Data?.now ?? new Date());
  const sleepWindow = {
    sleepTime: props.profile?.settings?.sleep_time?.slice?.(0, 5) || "23:00",
    wakeTime: props.profile?.settings?.wake_time?.slice?.(0, 5) || "07:00",
  };
  return {
    eventsCount: sortedEvents.length,
    classesCount: countAcademicSessions(sortedEvents),
    liveContext: getLiveContext({ currentEvent, upcomingEvent, overlaps: props.slot5Data?.navigatorContext?.overlaps, tflDelays, now: props.slot5Data?.now ?? new Date(), getRelevantDelays, isSevereDisruption, sleepWindow }),
    tasksCount: pendingTasks.length,
  };
}

function countAcademicSessions(events) {
  return events.filter(isAcademicSession).length;
}

function isAcademicSession(event) {
  const source = String(event?.source || "");
  if (source === "society") return false;
  const tagName = String(event?.tag_name || event?.tag?.name || "").toLowerCase();
  const combinedCopy = `${event?.title || ""} ${event?.description || ""}`.toLowerCase();
  return source === "timetable"
    || source.startsWith("module_")
    || ["lecture", "tutorial", "seminar", "practical", "lab", "small group", "smg", "lgt"].some((token) => tagName.includes(token) || combinedCopy.includes(token));
}

function getStorageKeys(userId) {
  return {
    layout: userId ? `homepage_widget_layout_${userId}` : "homepage_widget_layout",
    sizes: userId ? `homepage_widget_sizes_${userId}` : "homepage_widget_sizes",
    source: userId ? `homepage_widget_source_${userId}` : "homepage_widget_source",
  };
}

function readStoredLayout(profile) {
  const keys = getStorageKeys(profile?.id);
  const serverLayout = getServerLayout(profile);
  if (serverLayout && shouldPreferServerSettings(profile, keys)) return serverLayout;
  return sanitizeLayout(readStoredValue(keys.layout) || serverLayout || DEFAULT_LAYOUT);
}

function readStoredWidgetSizes(profile) {
  const keys = getStorageKeys(profile?.id);
  const serverSizes = getServerWidgetSizes(profile);
  if (serverSizes && shouldPreferServerSettings(profile, keys)) return serverSizes;
  return readStoredValue(keys.sizes) || serverSizes || {};
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

function getServerLayout(profile) {
  if (!profile?.settings?.homepage_widgets?.length) return null;
  return sanitizeLayout(profile.settings.homepage_widgets);
}

function getServerWidgetSizes(profile) {
  const widgetSizes = profile?.settings?.homepage_widget_sizes;
  if (!widgetSizes || typeof widgetSizes !== "object") return null;
  return widgetSizes;
}

function buildServerSettingsSnapshot(profile) {
  const layout = getServerLayout(profile);
  if (!layout) return null;
  const sizes = Object.fromEntries(Object.entries(getServerWidgetSizes(profile) || {}).sort(([a], [b]) => a.localeCompare(b)));
  return { layout, sizes };
}

function shouldPreferServerSettings(profile, storageKeys) {
  const serverSnapshot = buildServerSettingsSnapshot(profile);
  if (!serverSnapshot) return false;
  return JSON.stringify(readStoredValue(storageKeys.source)) !== JSON.stringify(serverSnapshot);
}

function sanitizeLayout(layout) {
  return ensureHero((Array.isArray(layout) ? layout : DEFAULT_LAYOUT).filter((id) => CATALOGUE_IDS.has(id)));
}

function ensureHero(layout) {
  const next = layout.includes(HERO_ID) ? layout : [HERO_ID, ...layout];
  return Array.from(new Set(next));
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
  if (profileLoading || !profile?.settings?.homepage_widgets?.length) return;
  const storageKeys = getStorageKeys(profile.id);
  if (!shouldPreferServerSettings(profile, storageKeys)) return;
  setLayout(sanitizeLayout(profile.settings.homepage_widgets));
  setWidgetSizes(profile.settings.homepage_widget_sizes || {});
  writeStoredValue(storageKeys.source, buildServerSettingsSnapshot(profile));
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
  return { edit, setEdit, setShowAdd, setShowCourseChange, setShowResetConfirm, showAdd, showCourseChange, showResetConfirm };
}

function buildDashboardState(analytics, attendance, courseChangeRequest, layout, live, setLayout, tflDelays, ui, widgetSizes, setWidgetSizes) {
  return { ...getDashboardData(analytics, attendance, courseChangeRequest, layout, live, tflDelays, ui, widgetSizes), ...getDashboardActions(setLayout, setWidgetSizes, ui) };
}

function getDashboardActions(setLayout, setWidgetSizes, ui) {
  return { handleRandomize: () => setLayout(randomizeLayout), handleReset: () => ui.setShowResetConfirm(true), setEdit: ui.setEdit, setLayout, setShowAdd: ui.setShowAdd, setShowCourseChange: ui.setShowCourseChange, setShowResetConfirm: ui.setShowResetConfirm, setWidgetSize: (id, size) => setWidgetSizes((prev) => ({ ...prev, [id]: size })) };
}

function getDashboardData(analytics, attendance, courseChangeRequest, layout, live, tflDelays, ui, widgetSizes) {
  return { analytics, attendance, courseChangeRequest: ui.showCourseChange ? courseChangeRequest : null, edit: ui.edit, layout, live, showAdd: ui.showAdd, showResetConfirm: ui.showResetConfirm, tflDelays, widgetSizes };
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
