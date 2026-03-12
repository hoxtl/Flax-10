import { motion } from "framer-motion";
import { Calendar, Settings2, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";
import { useProfileSummary } from "../../Profile/hooks/useProfileSummary";
import {
  getGreeting,
  getTodayLabel,
  getNextWindowMeta,
  getNextStep,
  getCurrentEvent,
  getUpcomingEvent,
  getLiveContext,
} from "./IntelligenceRowUtils";
import { useTflDelays } from "./hooks/useTflDelays";

export default function IntelligenceRow({
  displayName,
  studyPulseWindows,
  studyPulseNow,
  slot5Data,
  recommendation,
  homepageWidgets = [],
  isEditingDashboard,
  setIsEditingDashboard,
  saveWidgetLayout,
  widgetElements = {},
}) {
  const tflDelays = useTflDelays();
  const { summary, loading: profileLoading } = useProfileSummary();
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
  });
  const LiveContextIcon = liveContext.Icon;
  
  const pendingTasks = Array.isArray(slot5Data?.taskWidgetItemsOnly) ? slot5Data.taskWidgetItemsOnly.filter((t) => !t.completed) : [];
  const tasksCount = pendingTasks.length;
  const nextWindowMeta = getNextWindowMeta(studyPulseWindows, studyPulseNow ?? new Date());
  const nextStep = recommendation?.text || getNextStep({ tasksCount, nextWindowMeta });
  
  const weekly = !profileLoading ? summary?.weekly : null;
  const streaks = !profileLoading ? summary?.streaks : null;
  const weeklyProgress = Number.isFinite(weekly?.percentage) ? `${Math.round(weekly.percentage)}% weekly goal` : null;
  const currentStreak = Number.isFinite(streaks?.current) && streaks.current > 0 ? `${streaks.current}-day streak` : null;

  const moveWidget = (index, direction) => {
    const newLayout = [...homepageWidgets];
    const target = index + direction;
    if (target < 0 || target >= newLayout.length) return;
    const temp = newLayout[index];
    newLayout[index] = newLayout[target];
    newLayout[target] = temp;
    saveWidgetLayout(newLayout);
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <motion.span className={styles.headerDateRow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <Calendar className={styles.headerDateIcon} size={14} strokeWidth={2} aria-hidden />
            <span className={styles.headerLabel}>{getTodayLabel()}</span>
          </motion.span>
          <motion.h2 className={styles.headerTitle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            {getGreeting(displayName)}
          </motion.h2>
          <div className={`${styles.liveContextCard} ${liveContext.tone === "warning" ? styles.liveContextInlineAlert : ""}`}>
            <div className={styles.liveContextTop}>
              {liveContext.tone === "warning" ? (
                <span className={styles.liveContextDot} aria-hidden />
              ) : (
                <>
                  <span className={styles.liveContextLabel}>{liveContext.label}</span>
                  <LiveContextIcon size={14} strokeWidth={1.9} className={styles.liveContextIcon} aria-hidden />
                </>
              )}
            </div>
            <div className={styles.liveContextBody}>
              <p className={styles.liveContextText}>{liveContext.text}</p>
              {liveContext.meta && <span className={styles.liveContextMeta}>{liveContext.meta}</span>}
            </div>
          </div>
        </div>

        <motion.div className={styles.headerRight} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
          <div className={styles.headerPlannerPanel}>
            <div className={styles.metricRail}>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>On today</span>
                <span className={styles.metricValue}>{sortedEvents.length}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>To do today</span>
                <span className={styles.metricValue}>{tasksCount}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>Free to study</span>
                <span className={styles.metricValue}>{nextWindowMeta?.duration || "No gap"}</span>
              </div>
            </div>
            <div className={styles.nextStepCard}>
              <span className={styles.nextStepLabel}>Best next move</span>
              <p className={styles.nextStepText}>{nextStep}</p>
              {recommendation?.meta && <span className={styles.nextStepMeta}>{recommendation.meta}</span>}
              <div className={styles.nextStepFooter}>
                <div className={styles.analyticsInline}>
                  {weeklyProgress && <span className={styles.analyticsPill}>{weeklyProgress}</span>}
                  {currentStreak && <span className={styles.analyticsPill}>{currentStreak}</span>}
                  {!weeklyProgress && !currentStreak && nextWindowMeta?.label && <span className={styles.analyticsPill}>{nextWindowMeta.label}</span>}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <Link to="/analytics?period=7&tab=Overview" className={styles.analyticsLink}>Review analytics</Link>
                  <button type="button" className={styles.editDashboardBtn} onClick={() => setIsEditingDashboard(!isEditingDashboard)}>
                    <Settings2 size={12} /> {isEditingDashboard ? "Done editing" : "Edit widgets"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </header>

      <BentoGrid className={styles.primaryGrid}>
        {homepageWidgets.map((widget, i) => {
          const el = widgetElements[widget.id];
          if (!el) return null;
          return (
            <BentoCard key={widget.id} className={`${styles.bentoSlot} ${styles[`bentoSlotVariant${widget.id}`] || ""}`}>
              {el}
              {isEditingDashboard && (
                <div className={styles.widgetEditOverlay}>
                  <div className={styles.widgetEditActions}>
                    <button type="button" onClick={() => moveWidget(i, -1)} disabled={i === 0}><ArrowUp size={16}/></button>
                    <button type="button" onClick={() => moveWidget(i, 1)} disabled={i === homepageWidgets.length - 1}><ArrowDown size={16}/></button>
                  </div>
                </div>
              )}
            </BentoCard>
          );
        })}
      </BentoGrid>
    </section>
  );
}
