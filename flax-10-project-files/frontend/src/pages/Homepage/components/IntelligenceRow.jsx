import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock3, Train, AlertTriangle, BarChart3, LayoutGrid, Zap, TrendingUp, Presentation, HeartPulse } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../../api/tflApi";
import { getMyCourseChangeRequest } from "../../../api/adminApi";
import { loadTermConfig } from "../../../lib/termConfig";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";
import { getRelevantDelays, isSevereDisruption } from "../utils/kclTflMapping";
import { ConfirmModal } from "../../../components/common";
import {
  getLiveContext,
  getNextStep,
  getCurrentEvent,
  getUpcomingEvent
} from "./IntelligenceUtils";

import { useAuth } from "../../../context/AuthContext";

import IntelligenceGrid from "./IntelligenceGrid";
import { IntelligenceHero } from "./IntelligenceWidgets";
import { RightNowWidget } from "./RightNowWidget";
import SemesterOverviewWidget from "./SemesterOverviewWidget";
import StudyStreakWidget from "./StudyStreakWidget";
import WeeklyGoalWidget from "./WeeklyGoalWidget";
import PhotoWidget from "./PhotoWidget";
import SummaryCards from "../../../components/Analytics/SummaryCards";
import ProductivityCards from "../../../components/Analytics/ProductivityCards";
import StudyHoursChart from "../../../components/Analytics/StudyHoursChart";
import DailyBreakdownChart from "../../../components/Analytics/DailyBreakdownChart";
import StudyHeatmap from "../../../components/Analytics/StudyHeatmap";
import PlannedVsActualChart from "../../../components/Analytics/PlannedVsActualChart";
import ThemeUsageChart from "../../../components/Analytics/ThemeUsageChart";
import AttendanceChart from "../../../components/Analytics/AttendanceChart";
import { ConsistencyScore, PeakHoursCard } from "../../../components/Analytics/InsightCards";
import useAnalyticsOverview from "../../Analytics/hooks/useAnalyticsOverview";
import { CompactAttendanceTile } from "../../Profile/components/ProfileWidgets";
import { TinyTimelineWidget } from "./TinyTimelineWidget";
import { updateUserSettings } from "../../../api/userApi";


const CATALOGUE = [
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
  { id: "analyticsStudyHours", label: "Study Hours", icon: "📈", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsHeatmap", label: "Focus Heatmap", icon: "🟩", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsPlannedActual", label: "Planned vs Actual", icon: "📈", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsVenio", label: "My Venio Analysis", icon: "🧭", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsAttendance", label: "Attendance", icon: "📋", col: 2, row: 2, minRow: 2, section: "Analytics" },
  { id: "analyticsThemeUsage", label: "Theme Usage", icon: "🌓", col: 1, row: 1, section: "Analytics" },
];

const DEFAULT_LAYOUT = ["hero", "deadlines", "todayTasks", "bigTimeline"];
const getStorageKeys = (userId) => ({
  layout: userId ? `homepage_widget_layout_${userId}` : "homepage_widget_layout",
  sizes: userId ? `homepage_widget_sizes_${userId}` : "homepage_widget_sizes",
});
const CATALOGUE_IDS = new Set(CATALOGUE.map((widget) => widget.id));

function useTflDelays() {
  const [delays, setDelays] = useState([]);
  useEffect(() => {
    let cancelled = false;
    tflService.getTfLDelays()
      .then(data => { if (!cancelled) setDelays(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setDelays([]); });
    return () => { cancelled = true; };
  }, []);
  return delays;
}

function useCourseChangePending() {
  const [request, setRequest] = useState(null);
  useEffect(() => {
    getMyCourseChangeRequest()
      .then((data) => {
        const status = String(data?.status || "").toLowerCase();
        if (status === "pending" || (data?.requested_course && status !== "approved" && status !== "rejected")) {
          setRequest(data);
        }
      })
      .catch(() => { });
  }, []);
  return request;
}

function useTeacherRequestPending() {
  const { profile, loading } = useAuth();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!loading && profile?.role === "pending_teacher") {
      setPending(true);
    } else if (!loading) {
      setPending(false);
    }
  }, [profile, loading]);
  return pending;
}

function getSemesterProgress(now = new Date()) {
  const cfg = loadTermConfig();
  const startDate = new Date(cfg?.startDate);
  if (Number.isNaN(startDate.getTime())) return null;

  startDate.setHours(0, 0, 0, 0);
  const extraWeeks = cfg?.hasReadingWeek ? 1 : 0;
  const totalWeeks = Math.max(1, Number(cfg?.totalWeeks || 0) + extraWeeks);
  const totalDays = totalWeeks * 7;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + totalDays - 1);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const elapsedDays = Math.floor((today - startDate) / (24 * 60 * 60 * 1000));
  const clampedElapsed = Math.min(Math.max(elapsedDays + 1, 0), totalDays);
  const pct = Math.round((clampedElapsed / totalDays) * 100);

  return {
    pct,
    hasStarted: today >= startDate,
    isFinished: today > endDate,
  };
}

function SemesterProgressWidget() {
  const progress = getSemesterProgress();
  if (!progress) return null;

  let label = "Semester not started";
  if (progress.isFinished) label = "Semester completed";
  else if (progress.hasStarted) label = `${progress.pct}% through term`;

  return (
    <div className={styles.semesterWidget}>
      <div className={styles.semesterWidgetHead}>
        <span className={styles.semesterWidgetLabel}>Semester progress</span>
        <span className={styles.semesterWidgetValue}>{progress.pct}%</span>
      </div>
      <div className={styles.semesterWidgetTrack} aria-hidden="true">
        <div className={styles.semesterWidgetFill} style={{ width: `${progress.pct}%` }} />
      </div>
      <span className={styles.semesterWidgetMeta}>{label}</span>
    </div>
  );
}

export default function IntelligenceRow({
  displayName,
  slot1TodayTasks,
  slot3Urgent,
  slot5Data,
  slot6Timeline,
  recommendation,
}) {
  const tflDelays = useTflDelays();
  const courseChangeRequest = useCourseChangePending();
  const teacherRequestPending = useTeacherRequestPending();
  const [showCourseChange, setShowCourseChange] = useState(true);
  const [showTeacherRequest, setShowTeacherRequest] = useState(true);
  const { profile, loading: profileLoading } = useAuth();
  const [edit, setEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const keys = getStorageKeys(profile?.id);
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem(keys.layout);
    if (saved) {
      try {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Migration: If old IDs exist, replace them with 'hero'
          const oldIds = ["greeting", "stats", "nextMove", "studyPulse", "socialDiscover", "analyticsSummary", "analyticsPlannedActual", "quickActions"];
          const hasOld = parsed.some(id => oldIds.includes(id));
          if (hasOld) {
            const filtered = parsed.filter(id => !oldIds.includes(id));
            if (!filtered.includes("hero")) filtered.unshift("hero");
            return filtered.filter((id) => CATALOGUE_IDS.has(id));
          }
          return parsed.filter((id) => CATALOGUE_IDS.has(id));
        }
      } catch (e) { console.error("Failed to parse layout from localStorage", e); }
    }
    // Fallback to backend settings ONLY if we have them immediately
    if (profile?.settings?.homepage_widgets?.length) {
      return profile.settings.homepage_widgets;
    }
    return DEFAULT_LAYOUT;
  });

  const [widgetSizes, setWidgetSizes] = useState(() => {
    const saved = localStorage.getItem(keys.sizes);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    // Fallback to backend settings
    if (profile?.settings?.homepage_widget_sizes && Object.keys(profile.settings.homepage_widget_sizes).length > 0) {
      return profile.settings.homepage_widget_sizes;
    }
    return {};
  });

  // Effect to sync state from backend when profile loads if localStorage is empty for this user
  useEffect(() => {
    if (profileLoading || !profile?.settings) return;
    
    // If we don't have a layout in localStorage for this specific user, use backend layout
    const userKeys = getStorageKeys(profile.id);
    const savedLayout = localStorage.getItem(userKeys.layout);
    
    if (!savedLayout && profile.settings.homepage_widgets?.length) {
      setLayout(profile.settings.homepage_widgets);
      if (profile.settings.homepage_widget_sizes) {
        setWidgetSizes(profile.settings.homepage_widget_sizes);
      }
    }
  }, [profile, profileLoading]);

  const hasAnalyticsWidgets = layout.some((id) => id.startsWith("analytics"));
  const {
    data: analyticsData,
    progressData: analyticsProgressData,
    themeStats: analyticsThemeStats,
    loading: analyticsLoading,
  } = useAnalyticsOverview(hasAnalyticsWidgets ? 30 : null);

  useEffect(() => {
    localStorage.setItem(keys.layout, JSON.stringify(layout));
  }, [layout, keys.layout]);

  useEffect(() => {
    localStorage.setItem(keys.sizes, JSON.stringify(widgetSizes));
  }, [widgetSizes, keys.sizes]);

  // Sync to Cloud after 2s of inactivity to debounce
  useEffect(() => {
    if (profileLoading || !profile) return;
    const timer = setTimeout(() => {
      updateUserSettings({
        homepage_widgets: layout,
        homepage_widget_sizes: widgetSizes
      }).catch(err => console.error("Failed to sync layout to cloud:", err));
    }, 2000);
    return () => clearTimeout(timer);
  }, [layout, widgetSizes, profile, profileLoading]);

  const setWidgetSize = (id, size) => {
    setWidgetSizes((prev) => ({
      ...prev,
      [id]: size,
    }));
  };

  const handleRandomize = () => {
    // Only shuffle the widgets that are currently on the dashboard
    const hasHero = layout.includes("hero");
    const others = layout.filter((id) => id !== "hero");
    
    if (others.length <= 1) return; // Nothing much to shuffle
    
    const shuffled = [...others].sort(() => 0.5 - Math.random());
    const newLayout = hasHero ? ["hero", ...shuffled] : shuffled;
    
    setLayout(newLayout);
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => setShowResetConfirm(true);

  // Data Processing
  const eventsCount = Array.isArray(slot5Data?.sortedEvents) ? slot5Data.sortedEvents.length : 0;
  const pendingTasks = Array.isArray(slot5Data?.taskWidgetItemsOnly)
    ? slot5Data.taskWidgetItemsOnly.filter((task) => !task.completed)
    : [];
  const sortedEvents = Array.isArray(slot5Data?.sortedEvents) ? slot5Data.sortedEvents : [];
  const bannerNow = slot5Data?.now ?? new Date();

  const currentEvent = getCurrentEvent(sortedEvents, bannerNow);
  const upcomingEvent = getUpcomingEvent(sortedEvents, bannerNow);

  const liveContext = getLiveContext({
    currentEvent,
    upcomingEvent,
    overlaps: slot5Data?.navigatorContext?.overlaps,
    tflDelays,
    now: bannerNow,
    getRelevantDelays,
    isSevereDisruption
  });

  const tasksCount = pendingTasks.length;
  const nextWindowMeta = null;
  const nextStepTxt = recommendation?.text || getNextStep({ tasksCount, nextWindowMeta });
  const nextStepMeta = recommendation?.meta || null;

  const weekly = !profileLoading ? profile?.summary?.weekly : null;
  const streaks = !profileLoading ? profile?.summary?.streaks : null;
  const weeklyProgress = Number.isFinite(weekly?.percentage) ? `${Math.round(weekly.percentage)}% weekly goal` : null;
  const currentStreak = Number.isFinite(streaks?.current) && streaks.current > 0 ? `${streaks.current}-day streak` : null;

  const renderWidget = (id, { col, row } = {}) => {
    switch (id) {
      case "hero":
        return (
          <IntelligenceHero
            displayName={displayName}
            liveContext={liveContext}
            eventsCount={eventsCount}
            tasksCount={tasksCount}
            nextWindowMeta={nextWindowMeta}
            nextStep={nextStepTxt}
            nextStepMeta={nextStepMeta}
            weeklyProgress={weeklyProgress}
            currentStreak={currentStreak}
            courseChangeRequest={showCourseChange ? courseChangeRequest : null}
            teacherRequestPending={showTeacherRequest ? teacherRequestPending : null}
            onDismissCourseChange={() => setShowCourseChange(false)}
            onDismissTeacherRequest={() => setShowTeacherRequest(false)}
          />
        );
      case "rightNow":
        return <RightNowWidget {...slot5Data} tflDelays={tflDelays} />;
      case "todayTasks":
        return React.isValidElement(slot1TodayTasks) ? React.cloneElement(slot1TodayTasks, { row }) : slot1TodayTasks;
      case "deadlines":
        return React.isValidElement(slot3Urgent) ? React.cloneElement(slot3Urgent, { row }) : slot3Urgent;
      case "tinyTimeline":
        return <TinyTimelineWidget {...slot5Data} row={row} />;
      case "bigTimeline":
        return React.isValidElement(slot6Timeline) ? React.cloneElement(slot6Timeline, { row, isWidget: true }) : slot6Timeline;
      case "semesterOverview":
        return <SemesterOverviewWidget row={row} />;
      case "studyStreak":
        return <StudyStreakWidget />;
      case "weeklyGoal":
        return <WeeklyGoalWidget />;
      case "photo":
        return <PhotoWidget editMode={edit} />;
      case "analyticsSummary":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <LayoutGrid size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>SUMMARY</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : analyticsData?.summary ? (
              <div className={styles.analyticsScrollable}>
                <SummaryCards data={analyticsData} />
              </div>
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No summary data yet.</div>
            )}
          </div>
        );
      case "analyticsProductivity":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <TrendingUp size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>PRODUCTIVITY</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : analyticsData?.summary ? (
              <div className={styles.analyticsScrollable}>
                <ProductivityCards data={analyticsData} progressData={analyticsProgressData} />
              </div>
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No productivity data yet.</div>
            )}
          </div>
        );
      case "analyticsInsights":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <Zap size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>INSIGHTS</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : analyticsData?.summary ? (
              <div className={styles.analyticsInsightsRow}>
                <ConsistencyScore data={analyticsData} />
                <PeakHoursCard data={analyticsData} />
              </div>
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No insights data yet.</div>
            )}
          </div>
        );
      case "analyticsStudyHours":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <Clock3 size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>STUDY HOURS</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : Array.isArray(analyticsData?.daily_breakdown) && analyticsData.daily_breakdown.length > 0 ? (
              <StudyHoursChart data={analyticsData.daily_breakdown} row={row} />
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No study-hours data yet.</div>
            )}
          </div>
        );
      case "analyticsDailyBreakdown":
        return (
          <div className={styles.analyticsWidgetShell}>
             <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <BarChart3 size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>DAILY BREAKDOWN</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : Array.isArray(analyticsData?.daily_breakdown) && analyticsData.daily_breakdown.length > 0 ? (
              <DailyBreakdownChart data={analyticsData.daily_breakdown} />
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No daily-breakdown data yet.</div>
            )}
          </div>
        );
      case "analyticsPlannedActual":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <TrendingUp size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>PLANNED VS ACTUAL</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : Array.isArray(analyticsProgressData?.daily_progress) && analyticsProgressData.daily_progress.length > 0 ? (
              <PlannedVsActualChart data={analyticsProgressData.daily_progress} />
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No planned-vs-actual data yet.</div>
            )}
          </div>
        );
      case "analyticsHeatmap":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <LayoutGrid size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>FOCUS HEATMAP</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : analyticsData?.heatmap?.data?.length ? (
              <StudyHeatmap heatmapData={analyticsData.heatmap} />
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No focus heatmap data yet.</div>
            )}
          </div>
        );
      case "analyticsVenio":
        return <CompactAttendanceTile />;
      case "analyticsThemeUsage":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <TrendingUp size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>THEME USAGE</span>
            </div>
            {analyticsLoading ? (
              <div className={styles.analyticsWidgetLoading}>Loading analytics…</div>
            ) : analyticsThemeStats?.summary ? (
              <ThemeUsageChart themeStats={analyticsThemeStats} />
            ) : (
              <div className={styles.analyticsWidgetEmpty}>No theme-usage data yet.</div>
            )}
          </div>
        );
      case "analyticsAttendance":
        return (
          <div className={styles.analyticsWidgetShell}>
            <div className={baseStyles.widgetHeader}>
              <div className={baseStyles.headerIconWrap}>
                <Presentation size={16} strokeWidth={1.75} className={baseStyles.headerIcon} aria-hidden />
              </div>
              <span className={baseStyles.headerTitle}>ATTENDANCE</span>
            </div>
            <AttendanceChart />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className={styles.section}>
      <IntelligenceGrid
        layout={layout}
        setLayout={setLayout}
        widgetSizes={widgetSizes}
        setWidgetSize={setWidgetSize}
        edit={edit}
        setEdit={setEdit}
        onReset={handleReset}
        onRandomize={handleRandomize}
        catalogue={CATALOGUE}
        widgetRenderer={renderWidget}
        showAdd={showAdd}
        setShowAdd={setShowAdd}
      />
      {showResetConfirm && (
        <ConfirmModal
          title="Reset Layout"
          message="This will restore the default widget layout. Any customisation will be lost."
          confirmText="Reset"
          cancelText="Cancel"
          isDanger
          onConfirm={() => { setLayout(DEFAULT_LAYOUT); setShowResetConfirm(false); }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </section>
  );
}
