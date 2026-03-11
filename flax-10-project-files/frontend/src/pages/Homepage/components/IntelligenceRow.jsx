import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock3, Train, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../../api/tflService";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";
import { useProfileSummary } from "../../Profile/hooks/useProfileSummary";

function getGreeting(name) {
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}.`;
}

function getTodayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  return `${day} · ${date}`;
}

function formatWindowDuration(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function getNextWindowMeta(windows = [], now = new Date()) {
  const upcoming = windows
    .filter((window) => window?.end && window.end.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  if (!upcoming) return null;
  const start = upcoming.start?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const minutes = Math.max(0, Math.round((upcoming.end.getTime() - upcoming.start.getTime()) / 60000));
  return {
    label: start ? `Next focus window ${start}` : "Next focus window",
    duration: formatWindowDuration(minutes),
  };
}

function getPlanningSubtitle({ eventsCount, tasksCount, windowsCount, nextWindowMeta }) {
  if (tasksCount > 0 && nextWindowMeta?.duration) {
    return `${tasksCount} task${tasksCount === 1 ? "" : "s"} to move forward, ${eventsCount} event${eventsCount === 1 ? "" : "s"} on the day, and a ${nextWindowMeta.duration} focus window to work with.`;
  }
  if (tasksCount > 0) {
    return `${tasksCount} task${tasksCount === 1 ? "" : "s"} still need attention across ${eventsCount} event${eventsCount === 1 ? "" : "s"} today.`;
  }
  if (windowsCount > 0 && nextWindowMeta?.duration) {
    return `Your schedule is under control. The next open block gives you ${nextWindowMeta.duration} of usable focus time.`;
  }
  return "Use the timeline below as the source of truth, and the cards here as your planning controls.";
}

function getNextStep({ tasksCount, nextWindowMeta }) {
  if (tasksCount > 0 && nextWindowMeta?.duration) {
    return `Use the ${nextWindowMeta.duration} window to move one priority task forward.`;
  }
  if (tasksCount > 0) {
    return "Clear one meaningful task before the day fragments.";
  }
  if (nextWindowMeta?.duration) {
    return `Your next open block gives you ${nextWindowMeta.duration} to focus.`;
  }
  return "Keep the timeline as the source of truth for the rest of today.";
}

function getCurrentEvent(sortedEvents = [], now = new Date()) {
  const nowMs = now.getTime();
  return sortedEvents.find((event) => {
    if (!event?.start_time || !event?.end_time) return false;
    const startMs = new Date(event.start_time).getTime();
    const endMs = new Date(event.end_time).getTime();
    return startMs <= nowMs && endMs >= nowMs;
  }) || null;
}

function getUpcomingEvent(sortedEvents = [], now = new Date()) {
  const nowMs = now.getTime();
  return [...sortedEvents]
    .filter((event) => event?.start_time && new Date(event.start_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))[0] || null;
}

function formatEventTime(dateLike) {
  if (!dateLike) return null;
  return new Date(dateLike).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getLiveContext({ currentEvent, upcomingEvent, overlaps, tflDelays }) {
  if (currentEvent) {
    return {
      label: "On now",
      text: `${currentEvent.title}${currentEvent.location ? ` · ${currentEvent.location}` : ""}`,
      meta: currentEvent.end_time ? `Until ${formatEventTime(currentEvent.end_time)}` : null,
      tone: "neutral",
      Icon: Clock3,
    };
  }
  if (overlaps?.length) {
    const first = overlaps[0]?.a?.start_time;
    return {
      label: "Attention",
      text: "You have an overlap in today’s plan.",
      meta: first ? `Conflict at ${formatEventTime(first)}` : null,
      tone: "warning",
      Icon: AlertTriangle,
    };
  }
  if ((tflDelays || []).length > 0) {
    const firstDelay = tflDelays[0];
    return {
      label: "Travel",
      text: `${firstDelay.lineName || "TfL"} delays may affect your next journey.`,
      meta: firstDelay.severityDescription || "Check route before you leave",
      tone: "warning",
      Icon: Train,
    };
  }
  if (upcomingEvent) {
    return {
      label: "Up next",
      text: `${upcomingEvent.title}${upcomingEvent.location ? ` · ${upcomingEvent.location}` : ""}`,
      meta: upcomingEvent.start_time ? `Starts ${formatEventTime(upcomingEvent.start_time)}` : null,
      tone: "neutral",
      Icon: Clock3,
    };
  }
  return {
    label: "Right now",
    text: "You have breathing room before the next thing starts.",
    meta: "Use the banner to decide what to move forward next.",
    tone: "neutral",
    Icon: Clock3,
  };
}

function useTflDelays() {
  const [delays, setDelays] = useState(undefined);
  useEffect(() => {
    tflService.getTfLDelays()
      .then(data => setDelays(Array.isArray(data) ? data : []))
      .catch(() => setDelays([]));
  }, []);
  return delays;
}

export default function IntelligenceRow({
  displayName,
  slot1TodayTasks,
  slot3Urgent,
  studyPulseWindows,
  studyPulseNow,
  studyPulseOnStartFocus,
  studyPulseDeadlines,
  slot5Data,
}) {
  const tflDelays = useTflDelays();
  const { summary, loading: profileLoading } = useProfileSummary();
  const eventsCount = Array.isArray(slot5Data?.sortedEvents) ? slot5Data.sortedEvents.length : 0;
  const pendingTasks = Array.isArray(slot5Data?.taskWidgetItemsOnly)
    ? slot5Data.taskWidgetItemsOnly.filter((task) => !task.completed)
    : [];
  const sortedEvents = Array.isArray(slot5Data?.sortedEvents) ? slot5Data.sortedEvents : [];
  const currentEvent = getCurrentEvent(sortedEvents, slot5Data?.now ?? new Date());
  const upcomingEvent = getUpcomingEvent(sortedEvents, slot5Data?.now ?? new Date());
  const liveContext = getLiveContext({
    currentEvent,
    upcomingEvent,
    overlaps: slot5Data?.navigatorContext?.overlaps,
    tflDelays,
  });
  const LiveContextIcon = liveContext.Icon;
  const tasksCount = pendingTasks.length;
  const windowsCount = Array.isArray(studyPulseWindows) ? studyPulseWindows.length : 0;
  const nextWindowMeta = getNextWindowMeta(studyPulseWindows, studyPulseNow ?? new Date());
  const planningSubtitle = getPlanningSubtitle({
    eventsCount,
    tasksCount,
    windowsCount,
    nextWindowMeta,
  });
  const nextStep = getNextStep({ tasksCount, nextWindowMeta });
  const weekly = !profileLoading ? summary?.weekly : null;
  const streaks = !profileLoading ? summary?.streaks : null;
  const weeklyProgress = Number.isFinite(weekly?.percentage) ? `${Math.round(weekly.percentage)}% weekly goal` : null;
  const currentStreak = Number.isFinite(streaks?.current) && streaks.current > 0 ? `${streaks.current}-day streak` : null;

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <motion.span
            className={styles.headerDateRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Calendar className={styles.headerDateIcon} size={14} strokeWidth={2} aria-hidden />
            <span className={styles.headerLabel}>{getTodayLabel()}</span>
          </motion.span>
          <motion.h2
            className={styles.headerTitle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          >
            {getGreeting(displayName)}
          </motion.h2>
          <motion.p
            className={styles.headerSubtitle}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            {planningSubtitle}
          </motion.p>
          <div className={`${styles.liveContextCard} ${liveContext.tone === "warning" ? styles.liveContextCardWarning : ""}`}>
            <div className={styles.liveContextTop}>
              <span className={styles.liveContextLabel}>{liveContext.label}</span>
              <LiveContextIcon size={14} strokeWidth={1.9} className={styles.liveContextIcon} aria-hidden />
            </div>
            <p className={styles.liveContextText}>{liveContext.text}</p>
            {liveContext.meta && <span className={styles.liveContextMeta}>{liveContext.meta}</span>}
          </div>
        </div>

        <motion.div
          className={styles.headerRight}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
          <div className={styles.headerPlannerPanel}>
            <div className={styles.metricRail}>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>Events</span>
                <span className={styles.metricValue}>{eventsCount}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>Tasks in focus</span>
                <span className={styles.metricValue}>{tasksCount}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>Next open block</span>
                <span className={styles.metricValue}>
                  {nextWindowMeta?.duration || `${windowsCount} window${windowsCount === 1 ? "" : "s"}`}
                </span>
              </div>
            </div>
            <div className={styles.nextStepCard}>
              <span className={styles.nextStepLabel}>Best next move</span>
              <p className={styles.nextStepText}>{nextStep}</p>
              <div className={styles.nextStepFooter}>
                <div className={styles.analyticsInline}>
                  {weeklyProgress && <span className={styles.analyticsPill}>{weeklyProgress}</span>}
                  {currentStreak && <span className={styles.analyticsPill}>{currentStreak}</span>}
                  {!weeklyProgress && !currentStreak && nextWindowMeta?.label && (
                    <span className={styles.analyticsPill}>{nextWindowMeta.label}</span>
                  )}
                </div>
                <Link to="/analytics?period=7&tab=Overview&from=homepage-banner" className={styles.analyticsLink}>
                  Review analytics
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </header>

      <BentoGrid className={styles.primaryGrid}>
        <BentoCard className={styles.posDeadlines}>
          {slot3Urgent}
        </BentoCard>

        <BentoCard className={styles.posTodaysTasks}>
          {slot1TodayTasks}
        </BentoCard>
      </BentoGrid>
    </section>
  );
}
