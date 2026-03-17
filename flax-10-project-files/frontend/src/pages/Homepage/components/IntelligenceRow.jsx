import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock3, Train, AlertTriangle, BookOpen, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../../api/tflService";
import { getMyCourseChangeRequest } from "../../../api/adminApi";
import { loadTermConfig } from "../../../lib/termConfig";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";
import { getRelevantDelays, isSevereDisruption } from "../utils/kclTflMapping";
import { ConfirmModal } from "../../../components/common";
import {
  getLiveContext,
  getNextWindowMeta,
  getNextStep,
  getCurrentEvent,
  getUpcomingEvent
} from "./IntelligenceUtils";

import { useAuth } from "../../../context/AuthContext";

import IntelligenceGrid from "./IntelligenceGrid";
import { IntelligenceHero } from "./IntelligenceWidgets";
import { RightNowWidget } from "./RightNowWidget";
import { StudyPulseWidget } from "./StudyPulseWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { SocialDiscoverWidget } from "./SocialDiscoverWidget";
import SemesterOverviewWidget from "./SemesterOverviewWidget";
import StudyStreakWidget from "./StudyStreakWidget";
import WeeklyGoalWidget from "./WeeklyGoalWidget";
import PhotoWidget from "./PhotoWidget";

const CATALOGUE = [
  { id: "hero", label: "Intelligence Hero", icon: "✨", col: 2, row: 2 },
  { id: "deadlines", label: "Deadlines", icon: "⏰", col: 1, row: 2 },
  { id: "todayTasks", label: "Today's Tasks", icon: "✅", col: 1, row: 2 },
  { id: "rightNow", label: "Right Now", icon: "⌚", col: 1, row: 2 },
  { id: "studyPulse", label: "Focus Windows", icon: "📊", col: 1, row: 2 },
  { id: "semesterOverview", label: "Semester Overview", icon: "📅", col: 2, row: 2 },
  { id: "studyStreak", label: "Study Streak", icon: "🔥", col: 1, row: 1 },
  { id: "weeklyGoal", label: "Weekly Goal", icon: "🎯", col: 1, row: 1 },
  { id: "photo", label: "Photo", icon: "🖼️", col: 1, row: 1 },
  { id: "quickActions", label: "Quick Actions", icon: "⚡", col: 1, row: 1 },
  { id: "socialDiscover", label: "Discovery", icon: "🌍", col: 1, row: 1 },
];

const DEFAULT_LAYOUT = ["hero", "deadlines", "todayTasks"];
const STORAGE_KEY = "homepage_widget_layout";

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

function CourseChangeCard({ request, onDismiss }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className={styles.courseChangeCard}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
    >
      <BookOpen size={13} strokeWidth={2} className={styles.courseChangeIcon} aria-hidden />
      <div className={styles.courseChangeBody}>
        <span className={styles.courseChangeLabel}>Course change status: pending</span>
        <span className={styles.courseChangeSub}>
          Your request to switch
          {request.requested_course ? <> to <strong>{request.requested_course}</strong></> : null}
          {" "}is under admin review.
        </span>
      </div>
      <button
        type="button"
        className={styles.courseChangeViewBtn}
        onClick={() => navigate("/settings?tab=account")}
      >
        View
      </button>
      <button type="button" className={styles.courseChangeDismiss} onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    </motion.div>
  );
}

function TeacherRequestCard({ onDismiss }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className={styles.courseChangeCard}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
    >
      <GraduationCap size={13} strokeWidth={2} className={styles.courseChangeIcon} aria-hidden />
      <div className={styles.courseChangeBody}>
        <span className={styles.courseChangeLabel}>Teacher access status: pending</span>
        <span className={styles.courseChangeSub}>
          Your teacher application is under admin review.
        </span>
      </div>
      <button
        type="button"
        className={styles.courseChangeViewBtn}
        onClick={() => navigate("/settings?tab=course")}
      >
        View
      </button>
      <button type="button" className={styles.courseChangeDismiss} onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    </motion.div>
  );
}

export default function IntelligenceRow({
  displayName,
  slot1TodayTasks,
  slot3Urgent,
  studyPulseWindows,
  studyPulseNow,
  slot5Data,
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
  const [layout, setLayout] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_LAYOUT;
    let parsed = JSON.parse(saved);

    // Migration: If old IDs exist, replace them with 'hero'
    const oldIds = ["greeting", "stats", "nextMove"];
    const hasOld = parsed.some(id => oldIds.includes(id));
    if (hasOld) {
      // Remove old IDs and PREPEND 'hero' if not already there
      const filtered = parsed.filter(id => !oldIds.includes(id));
      if (!filtered.includes("hero")) {
        filtered.unshift("hero");
      }
      return filtered;
    }
    return parsed;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

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
  const nextWindowMeta = getNextWindowMeta(studyPulseWindows, studyPulseNow ?? new Date());
  const nextStepTxt = recommendation?.text || getNextStep({ tasksCount, nextWindowMeta });
  const nextStepMeta = recommendation?.meta || null;

  const weekly = !profileLoading ? profile?.summary?.weekly : null;
  const streaks = !profileLoading ? profile?.summary?.streaks : null;
  const weeklyProgress = Number.isFinite(weekly?.percentage) ? `${Math.round(weekly.percentage)}% weekly goal` : null;
  const currentStreak = Number.isFinite(streaks?.current) && streaks.current > 0 ? `${streaks.current}-day streak` : null;

  const renderWidget = (id) => {
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
          />
        );
      case "rightNow":
        return <RightNowWidget {...slot5Data} tflDelays={tflDelays} />;
      case "todayTasks":
        return slot1TodayTasks;
      case "deadlines":
        return slot3Urgent;
      case "studyPulse":
        return (
          <StudyPulseWidget
            windows={studyPulseWindows}
            now={studyPulseNow}
            deadlines={slot5Data?.studyPulseDeadlines || []}
          />
        );
      case "quickActions":
        return <QuickActionsWidget />;
      case "socialDiscover":
        return <SocialDiscoverWidget />;
      case "semesterOverview":
        return <SemesterOverviewWidget />;
      case "studyStreak":
        return <StudyStreakWidget />;
      case "weeklyGoal":
        return <WeeklyGoalWidget />;
      case "photo":
        return <PhotoWidget editMode={edit} />;
      default:
        return null;
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.editBar}>
        {edit && (
          <button onClick={handleReset} className={styles.editBtn} style={{ marginRight: 8 }}>
            ↺ Reset Layout
          </button>
        )}
        <button
          onClick={() => {
            setEdit(!edit);
            if (edit) setShowAdd(false);
          }}
          className={`${styles.editBtn} ${edit ? styles.editBtnActive : ""}`}
        >
          {edit ? "✓ Done" : "✏️ Edit Layout"}
        </button>
      </div>

      <IntelligenceGrid
        layout={layout}
        setLayout={setLayout}
        edit={edit}
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
