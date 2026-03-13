import React from "react";
import { motion } from "framer-motion";
import { Calendar, Clock3, Train, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./IntelligenceHeader.module.css";
import { getGreeting, getTodayLabel } from "./IntelligenceUtils";

const ICON_MAP = {
  Clock3: Clock3,
  Train: Train,
  AlertTriangle: AlertTriangle,
};

export const IntelligenceHero = ({ 
  displayName, 
  liveContext, 
  eventsCount, 
  tasksCount, 
  nextWindowMeta,
  nextStep,
  nextStepMeta,
  weeklyProgress,
  currentStreak
}) => {
  const LiveContextIcon = liveContext ? ICON_MAP[liveContext.iconKey] : Clock3;
  
  return (
    <div className={styles.premiumCard}>
      <div className={styles.header}>
        {/* Left Section: Greeting & Date */}
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
            style={{ marginTop: 8 }}
          >
            {getGreeting(displayName)}
          </motion.h2>
          
          {liveContext && (
            <div className={`${styles.liveContextCard} ${liveContext.tone === "warning" ? styles.liveContextInlineAlert : ""}`} style={{ marginTop: 12 }}>
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
          )}
        </div>

        {/* Right Section: Stats & Next Move */}
        <motion.div
          className={styles.headerRight}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className={styles.headerPlannerPanel}>
            <div className={styles.metricRail}>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>On today</span>
                <span className={styles.metricValue}>{eventsCount}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>To do today</span>
                <span className={styles.metricValue}>{tasksCount}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>Free to study</span>
                <span className={styles.metricValue}>
                  {nextWindowMeta?.duration || "No gap yet"}
                </span>
              </div>
            </div>
            
            <div className={styles.nextStepCard}>
              <span className={styles.nextStepLabel}>Best next move</span>
              <p className={styles.nextStepText}>{nextStep}</p>
              {nextStepMeta && <span className={styles.nextStepMeta}>{nextStepMeta}</span>}
              <div className={styles.nextStepFooter}>
                <div className={styles.analyticsInline}>
                  {weeklyProgress && <span className={styles.analyticsPill}>{weeklyProgress}</span>}
                  {currentStreak && <span className={styles.analyticsPill}>{currentStreak}</span>}
                  {!weeklyProgress && !currentStreak && nextWindowMeta?.label && (
                    <span className={styles.analyticsPill}>{nextWindowMeta.label}</span>
                  )}
                </div>
                <Link to="/analytics?period=7&tab=Overview&from=homepage-banner" className={styles.analyticsLink}>
                  Review my analytics
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export const GreetingWidget = ({ displayName, liveContext }) => (
  <div className={styles.premiumCard}>
    <div className={styles.headerLeft} style={{ padding: "26px 28px" }}>
      <span className={styles.headerLabel}>{getTodayLabel()}</span>
      <h2 className={styles.headerTitle} style={{ marginTop: 8 }}>{getGreeting(displayName)}</h2>
    </div>
  </div>
);

export const StatsWidget = ({ eventsCount, tasksCount, nextWindowMeta }) => (
  <div className={styles.premiumCard} style={{ padding: "26px 28px" }}>
     <div className={styles.metricRail}>
        <div className={styles.metricChip}>
          <span className={styles.metricLabel}>On today</span>
          <span className={styles.metricValue}>{eventsCount}</span>
        </div>
        <div className={styles.metricChip}>
          <span className={styles.metricLabel}>To do today</span>
          <span className={styles.metricValue}>{tasksCount}</span>
        </div>
      </div>
  </div>
);

