import React from "react";
import { Calendar, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./IntelligenceRow.module.css";
import { getGreeting, getTodayLabel } from "./IntelligenceRowUtils";

const HeaderLeft = ({ displayName, liveContext }) => {
  const LiveContextIcon = liveContext.Icon;
  return (
    <div className={styles.headerLeft}>
      <DateRow label={getTodayLabel()} />
      <GreetingTitle greeting={getGreeting(displayName)} />
      <LiveContextCard liveContext={liveContext} LiveContextIcon={LiveContextIcon} />
    </div>
  );
};

const DateRow = ({ label }) => (
  <motion.span className={styles.headerDateRow} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
    <Calendar className={styles.headerDateIcon} size={14} strokeWidth={2} aria-hidden />
    <span className={styles.headerLabel}>{label}</span>
  </motion.span>
);

const GreetingTitle = ({ greeting }) => (
  <motion.h2 className={styles.headerTitle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
    {greeting}
  </motion.h2>
);

const LiveContextCard = ({ liveContext, LiveContextIcon }) => (
  <div className={`${styles.liveContextCard} ${liveContext.tone === "warning" ? styles.liveContextInlineAlert : ""}`}>
    <LiveContextTop liveContext={liveContext} LiveContextIcon={LiveContextIcon} />
    <LiveContextBody liveContext={liveContext} />
  </div>
);

const LiveContextTop = ({ liveContext, LiveContextIcon }) => (
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
);

const LiveContextBody = ({ liveContext }) => (
  <div className={styles.liveContextBody}>
    <p className={styles.liveContextText}>{liveContext.text}</p>
    {liveContext.meta && <span className={styles.liveContextMeta}>{liveContext.meta}</span>}
  </div>
);

const MetricChip = ({ label, value }) => (
  <div className={styles.metricChip}>
    <span className={styles.metricLabel}>{label}</span>
    <span className={styles.metricValue}>{value}</span>
  </div>
);

const HeaderRight = (props) => (
  <motion.div className={styles.headerRight} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 }}>
    <div className={styles.headerPlannerPanel}>
      <div className={styles.metricRail}>
        <MetricChip label="On today" value={props.sortedEventsCount} />
        <MetricChip label="To do today" value={props.tasksCount} />
        <MetricChip label="Free to study" value={props.nextWindowMeta?.duration || "No gap"} />
      </div>
      <NextStepCard {...props} />
    </div>
  </motion.div>
);

const NextStepCard = (props) => (
  <div className={styles.nextStepCard}>
    <span className={styles.nextStepLabel}>Best next move</span>
    <p className={styles.nextStepText}>{props.nextStep}</p>
    {props.recommendation?.meta && <span className={styles.nextStepMeta}>{props.recommendation.meta}</span>}
    <NextStepFooter {...props} />
  </div>
);

const NextStepFooter = (props) => (
  <div className={styles.nextStepFooter}>
    <AnalyticsPills {...props} />
    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <Link to="/analytics?period=7&tab=Overview" className={styles.analyticsLink}>Review analytics</Link>
      <EditDashboardButton {...props} />
    </div>
  </div>
);

const AnalyticsPills = ({ weeklyProgress, currentStreak, nextWindowMeta }) => (
  <div className={styles.analyticsInline}>
    {weeklyProgress && <span className={styles.analyticsPill}>{weeklyProgress}</span>}
    {currentStreak && <span className={styles.analyticsPill}>{currentStreak}</span>}
    {!weeklyProgress && !currentStreak && nextWindowMeta?.label && <span className={styles.analyticsPill}>{nextWindowMeta.label}</span>}
  </div>
);

const EditDashboardButton = ({ isEditingDashboard, setIsEditingDashboard }) => (
  <button type="button" className={styles.editDashboardBtn} onClick={() => setIsEditingDashboard(!isEditingDashboard)}>
    <Settings2 size={12} /> {isEditingDashboard ? "Done editing" : "Edit widgets"}
  </button>
);

export default function IntelligenceHeader(props) {
  return (
    <header className={styles.header}>
      <HeaderLeft displayName={props.displayName} liveContext={props.liveContext} />
      <HeaderRight {...props} />
    </header>
  );
}

