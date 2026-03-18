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

export function IntelligenceHero({ 
  displayName, 
  liveContext, 
  eventsCount, 
  tasksCount, 
  nextWindowMeta,
  nextStep,
  nextStepMeta,
  weeklyProgress,
  currentStreak
}) {
  const Icon = (liveContext && ICON_MAP[liveContext.iconKey]) || Clock3;

  return (
    <div className={styles.premiumCard}>
      <header className={styles.header}>
        {/* Left Col: Greeting & Date */}
        <div className={styles.headerLeft}>
          <div className={styles.headerDateRow}>
            <Calendar className={styles.headerDateIcon} size={14} strokeWidth={2.2} aria-hidden />
            <span className={styles.headerLabel}>{getTodayLabel()}</span>
          </div>
          <h1 className={styles.headerTitle}>{getGreeting(displayName)}</h1>

          {/* Live Situation Pill / Prompt */}
          <div className={`${styles.liveContextCard} ${liveContext?.tone === "warning" ? styles.liveContextInlineAlert : ""}`} style={{ marginTop: 12 }}>
            <div className={styles.liveContextTop}>
              <span className={styles.liveContextLabel}>{liveContext?.label || "Status"}</span>
              {liveContext?.tone === "warning" ? (
                <div className={styles.liveContextDot} />
              ) : (
                <Icon className={styles.liveContextIcon} size={15} strokeWidth={2.2} />
              )}
            </div>
            <div className={styles.liveContextBody}>
              <p className={styles.liveContextText}>{liveContext?.text || "Checking your schedule..."}</p>
              {liveContext?.meta && <span className={styles.liveContextMeta}>{liveContext.meta}</span>}
            </div>
          </div>
        </div>

        {/* Right Col: Personal Stats & Best Next Step */}
        <div className={styles.headerRight}>
          <div className={styles.headerPlannerPanel}>
            {/* Quick Metrics */}
            <div className={styles.metricRail}>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>Events</span>
                <span className={styles.metricValue}>{eventsCount}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>To-do</span>
                <span className={styles.metricValue}>{tasksCount}</span>
              </div>
              <div className={styles.metricChip}>
                <span className={styles.metricLabel}>Focus</span>
                <span className={styles.metricValue}>{nextWindowMeta?.duration || "—"}</span>
              </div>
            </div>

            {/* Smart Recommendation */}
            <div className={styles.nextStepCard}>
              <span className={styles.nextStepLabel}>Suggested Focus</span>
              <p className={styles.nextStepText}>{nextStep}</p>
              <div className={styles.nextStepFooter}>
                {nextStepMeta ? (
                  <span className={styles.nextStepMeta}>{nextStepMeta}</span>
                ) : (
                  <div className={styles.analyticsInline}>
                    {currentStreak && <span className={styles.analyticsPill}>{currentStreak}</span>}
                    {weeklyProgress && <span className={styles.analyticsPill}>{weeklyProgress}</span>}
                  </div>
                )}
                <Link to="/analytics?period=7&tab=Overview&from=homepage-banner" className={styles.analyticsLink}>
                  View Stats →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default IntelligenceHero;
