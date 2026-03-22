/**
 * Intelligence hero widgets.
 */

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BookOpen, Calendar, Clock3, GraduationCap, Train } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "./IntelligenceHeader.module.css";
import { getGreeting, getTodayLabel } from "./IntelligenceUtils";

const ICON_MAP = { AlertTriangle, Clock3, Train };

export function IntelligenceHero(props) {
  const Icon = ICON_MAP[props.liveContext?.iconKey] || Clock3;
  return (
    <div className={styles.premiumCard}>
      <HeroBanners {...props} />
      <header className={getHeaderClassName(props)}>
        <HeroLeftColumn Icon={Icon} {...props} />
        <HeroRightColumn {...props} />
      </header>
    </div>
  );
}

function HeroBanners(props) {
  return <AnimatePresence>{props.courseChangeRequest && <CourseChangeBanner request={props.courseChangeRequest} onDismiss={props.onDismissCourseChange} />}{props.teacherRequestPending && <TeacherRequestBanner onDismiss={props.onDismissTeacherRequest} />}</AnimatePresence>;
}

function getHeaderClassName(props) {
  return `${styles.header} ${(props.courseChangeRequest || props.teacherRequestPending) ? styles.hasBanners : ""}`;
}

function CourseChangeBanner({ onDismiss, request }) {
  return <StatusBanner cta="/settings?tab=account" icon={BookOpen} onDismiss={onDismiss} text={request.requested_course ? <>Course switch pending to <strong>{request.requested_course}</strong></> : "Course switch pending"} />;
}

function TeacherRequestBanner({ onDismiss }) {
  return <StatusBanner cta="/settings?tab=course" icon={GraduationCap} onDismiss={onDismiss} text="Teacher application is under review" />;
}

function StatusBanner({ cta, icon: Icon, onDismiss, text }) {
  const navigate = useNavigate();
  return (
    <motion.div className={styles.statusBanner} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className={styles.statusBannerContent}><Icon size={14} className={styles.statusBannerIcon} /><p className={styles.statusBannerText}>{text}</p></div>
      <div className={styles.statusBannerActions}><button onClick={() => navigate(cta)} className={styles.statusBannerBtn}>View</button><button onClick={onDismiss} className={styles.statusBannerClose}>&times;</button></div>
    </motion.div>
  );
}

function HeroLeftColumn({ Icon, displayName, liveContext }) {
  return <div className={styles.headerLeft}><TodayHeader /><h1 className={styles.headerTitle}>{getGreeting(displayName)}</h1><LiveContextCard Icon={Icon} liveContext={liveContext} /></div>;
}

function TodayHeader() {
  return <div className={baseStyles.widgetHeader} style={{ marginBottom: 12 }}><div className={baseStyles.headerIconWrap}><Calendar className={baseStyles.headerIcon} size={16} strokeWidth={1.75} aria-hidden /></div><span className={baseStyles.headerMeta}>{getTodayLabel()}</span></div>;
}

function LiveContextCard({ Icon, liveContext }) {
  return (
    <div className={`${styles.liveContextCard} ${liveContext?.tone === "warning" ? styles.liveContextInlineAlert : ""}`} style={{ marginTop: 12 }}>
      <div className={styles.liveContextTop}><span className={styles.liveContextLabel}>{liveContext?.label || "Status"}</span>{liveContext?.tone === "warning" ? <div className={styles.liveContextDot} /> : <Icon className={styles.liveContextIcon} size={15} strokeWidth={2.2} />}</div>
      <div className={styles.liveContextBody}><p className={styles.liveContextText}>{liveContext?.text || "Checking your schedule..."}</p>{liveContext?.meta && <span className={styles.liveContextMeta}>{liveContext.meta}</span>}</div>
    </div>
  );
}

function HeroRightColumn(props) {
  return <div className={styles.headerRight}><div className={styles.headerPlannerPanel}><MetricRail eventsCount={props.eventsCount} tasksCount={props.tasksCount} duration={props.nextWindowMeta?.duration} /><SuggestionCard {...props} /></div></div>;
}

function MetricRail({ duration, eventsCount, tasksCount }) {
  return <div className={styles.metricRail}><MetricChip label="Events" value={eventsCount} /><MetricChip label="To-do" value={tasksCount} /><MetricChip label="Focus" value={duration || "—"} /></div>;
}

function MetricChip({ label, value }) {
  return <div className={styles.metricChip}><span className={styles.metricLabel}>{label}</span><span className={styles.metricValue}>{value}</span></div>;
}

function SuggestionCard({ currentStreak, nextStep, nextStepMeta, weeklyProgress }) {
  return (
    <div className={styles.nextStepCard}>
      <span className={styles.nextStepLabel}>Suggested Focus</span>
      <p className={styles.nextStepText}>{nextStep}</p>
      <div className={styles.nextStepFooter}>{nextStepMeta ? <span className={styles.nextStepMeta}>{nextStepMeta}</span> : <AnalyticsInline currentStreak={currentStreak} weeklyProgress={weeklyProgress} />}<Link to="/analytics?period=7&tab=Overview&from=homepage-banner" className={styles.analyticsLink}>View Stats →</Link></div>
    </div>
  );
}

function AnalyticsInline({ currentStreak, weeklyProgress }) {
  return <div className={styles.analyticsInline}>{currentStreak && <span className={styles.analyticsPill}>{currentStreak}</span>}{weeklyProgress && <span className={styles.analyticsPill}>{weeklyProgress}</span>}</div>;
}

export default IntelligenceHero;
