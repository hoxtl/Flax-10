import React, { useState, useEffect } from "react";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../../api/tflService";
import { useProfileSummary } from "../../Profile/hooks/useProfileSummary";
import { getRelevantDelays, isSevereDisruption } from "../utils/kclTflMapping";
import { ConfirmModal } from "../../../components/common";
import {
  getLiveContext,
  getNextWindowMeta,
  getNextStep,
  getCurrentEvent,
  getUpcomingEvent
} from "./IntelligenceUtils";

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
  { id: "hero",              label: "Intelligence Hero",   icon: "✨", col: 2, row: 2 },
  { id: "deadlines",        label: "Deadlines",           icon: "⏰", col: 1, row: 2 },
  { id: "todayTasks",       label: "Today's Tasks",       icon: "✅", col: 1, row: 2 },
  { id: "rightNow",         label: "Right Now",           icon: "⌚", col: 1, row: 2 },
  { id: "studyPulse",       label: "Focus Windows",       icon: "📊", col: 1, row: 2 },
  { id: "semesterOverview", label: "Semester Overview",   icon: "📅", col: 2, row: 2 },
  { id: "studyStreak",      label: "Study Streak",        icon: "🔥", col: 1, row: 1 },
  { id: "weeklyGoal",       label: "Weekly Goal",         icon: "🎯", col: 1, row: 1 },
  { id: "photo",            label: "Photo",               icon: "🖼️", col: 1, row: 1 },
  { id: "quickActions",     label: "Quick Actions",       icon: "⚡", col: 1, row: 1 },
  { id: "socialDiscover",   label: "Discovery",           icon: "🌍", col: 1, row: 1 },
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
  const { summary, loading: profileLoading } = useProfileSummary();
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

  const weekly = !profileLoading ? summary?.weekly : null;
  const streaks = !profileLoading ? summary?.streaks : null;
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
