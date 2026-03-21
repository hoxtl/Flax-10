import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock3, Train, AlertTriangle, BookOpen, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "./IntelligenceHeader.module.css";
import { getGreeting, getTodayLabel } from "./IntelligenceUtils";

const ICON_MAP = {
  Clock3: Clock3,
  Train: Train,
  AlertTriangle: AlertTriangle,
};

function CourseChangeBanner({ request, onDismiss }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className={styles.statusBanner}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className={styles.statusBannerContent}>
        <BookOpen size={14} className={styles.statusBannerIcon} />
        <p className={styles.statusBannerText}>
          Course switch pending 
          {request.requested_course ? <> to <strong>{request.requested_course}</strong></> : null}
        </p>
      </div>
      <div className={styles.statusBannerActions}>
        <button onClick={() => navigate("/settings?tab=account")} className={styles.statusBannerBtn}>View</button>
        <button onClick={onDismiss} className={styles.statusBannerClose}>&times;</button>
      </div>
    </motion.div>
  );
}

function TeacherRequestBanner({ onDismiss }) {
  const navigate = useNavigate();
  return (
    <motion.div
      className={styles.statusBanner}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className={styles.statusBannerContent}>
        <GraduationCap size={14} className={styles.statusBannerIcon} />
        <p className={styles.statusBannerText}>Teacher application is under review</p>
      </div>
      <div className={styles.statusBannerActions}>
        <button onClick={() => navigate("/settings?tab=course")} className={styles.statusBannerBtn}>View</button>
        <button onClick={onDismiss} className={styles.statusBannerClose}>&times;</button>
      </div>
    </motion.div>
  );
}

export function IntelligenceHero({ 
  displayName, 
  liveContext, 
  eventsCount, 
  tasksCount, 
  nextWindowMeta,
  nextStep,
  nextStepMeta,
  weeklyProgress,
  currentStreak,
  courseChangeRequest,
  teacherRequestPending,
  onDismissCourseChange,
  onDismissTeacherRequest
}) {
  const Icon = (liveContext && ICON_MAP[liveContext.iconKey]) || Clock3;

  return (
    <div className={styles.premiumCard}>
      <AnimatePresence>
        {courseChangeRequest && (
          <CourseChangeBanner request={courseChangeRequest} onDismiss={onDismissCourseChange} />
        )}
        {teacherRequestPending && (
          <TeacherRequestBanner onDismiss={onDismissTeacherRequest} />
        )}
      </AnimatePresence>
      <header className={`${styles.header} ${(courseChangeRequest || teacherRequestPending) ? styles.hasBanners : ""}`}>
        {/* Left Col: Greeting & Date */}
        <div className={styles.headerLeft}>
          <div className={baseStyles.widgetHeader} style={{ marginBottom: 12 }}>
            <div className={baseStyles.headerIconWrap}>
              <Calendar className={baseStyles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
            </div>
            <span className={baseStyles.headerMeta}>{getTodayLabel()}</span>
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
