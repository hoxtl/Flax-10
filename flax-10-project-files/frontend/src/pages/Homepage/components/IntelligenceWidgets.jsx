/**
 * Intelligence hero widgets.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BookOpen, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatStrip from "../../../components/Common/StatStrip/StatStrip";
import WelcomeBackgroundPaths from "../../../components/Welcome/WelcomeBackgroundPaths";
import { useCountUp } from "../../../hooks/useCountUp";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "./IntelligenceHeader.module.css";
import { getGreeting, getTodayLabel } from "./IntelligenceUtils";

const HERO_STAT_ROUTES = {
  societies: "/societies",
  tasks: "/tasks?filter=today",
};

export function IntelligenceHero(props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={styles.premiumCard}>
      <WelcomeBackgroundPaths embedded className={styles.heroPaths} count={16} />
      <motion.div
        className={styles.bannerBorderGlow}
        aria-hidden
        animate={reduceMotion ? {
          opacity: 0.9,
        } : {
          opacity: [0.72, 1, 0.8],
          boxShadow: [
            "0 0 0 1px var(--home-hero-glow-ring), 0 0 24px var(--home-hero-glow-shadow), 0 0 56px color-mix(in srgb, var(--home-hero-glow-shadow) 94%, transparent), inset 0 0 0 1px var(--home-hero-glow-inner), inset 0 0 22px color-mix(in srgb, var(--home-hero-glow-shadow) 34%, transparent)",
            "0 0 0 1px color-mix(in srgb, var(--home-hero-glow-ring) 100%, transparent), 0 0 36px color-mix(in srgb, var(--home-hero-glow-shadow) 118%, transparent), 0 0 74px color-mix(in srgb, var(--home-hero-glow-shadow) 118%, transparent), inset 0 0 0 1px color-mix(in srgb, var(--home-hero-glow-inner) 128%, transparent), inset 0 0 30px color-mix(in srgb, var(--home-hero-glow-shadow) 42%, transparent)",
            "0 0 0 1px var(--home-hero-glow-ring), 0 0 24px var(--home-hero-glow-shadow), 0 0 56px color-mix(in srgb, var(--home-hero-glow-shadow) 94%, transparent), inset 0 0 0 1px var(--home-hero-glow-inner), inset 0 0 22px color-mix(in srgb, var(--home-hero-glow-shadow) 34%, transparent)",
          ],
        }}
        transition={reduceMotion ? { duration: 0 } : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.bannerAura}
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0.44, scale: 1, x: "-4%", y: "-2%" }}
        animate={reduceMotion ? {
          opacity: 0.54,
        } : {
          opacity: [0.42, 0.72, 0.5, 0.42],
          scale: [1, 1.08, 0.98, 1],
          x: ["-4%", "5%", "-2%", "-4%"],
          y: ["-2%", "5%", "-3%", "-2%"],
        }}
        transition={reduceMotion ? { duration: 0 } : { duration: 12.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={styles.bannerShimmer}
        aria-hidden
        initial={reduceMotion ? false : { x: "-42%", opacity: 0 }}
        animate={reduceMotion ? { opacity: 0.22, x: "18%" } : { x: ["-42%", "122%"], opacity: [0, 0.5, 0] }}
        transition={reduceMotion ? { duration: 0 } : { duration: 5.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.15 }}
      />
      <HeroBanners {...props} />
      <header className={getHeaderClassName(props)}>
        <HeroLeftColumn displayName={props.displayName} isTeacher={props.isTeacher} />
        <HeroRightColumn {...props} />
      </header>
    </div>
  );
}

function HeroBanners(props) {
  return <AnimatePresence>{props.courseChangeRequest && <CourseChangeBanner request={props.courseChangeRequest} onDismiss={props.onDismissCourseChange} />}</AnimatePresence>;
}

function getHeaderClassName(props) {
  return `${styles.header} ${props.courseChangeRequest ? styles.hasBanners : ""}`;
}

function CourseChangeBanner({ onDismiss, request }) {
  return <StatusBanner cta="/settings?tab=account" icon={BookOpen} onDismiss={onDismiss} text={request.requested_course ? <>Course switch pending to <strong>{request.requested_course}</strong></> : "Course switch pending"} />;
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

function HeroLeftColumn({ displayName, isTeacher }) {
  return <div className={styles.headerLeft}><TodayHeader /><h1 className={styles.headerTitle}>{getGreeting(displayName, isTeacher)}</h1></div>;
}

function TodayHeader() {
  return <div className={baseStyles.widgetHeader} style={{ marginBottom: 8 }}><div className={baseStyles.headerIconWrap}><Calendar className={baseStyles.headerIcon} size={16} strokeWidth={1.75} aria-hidden /></div><span className={baseStyles.headerMeta}>{getTodayLabel()}</span></div>;
}

function HeroRightColumn({ attendancePct, classesCount, deadlinesCount, upcomingSocietyEventsCount, tasksCount, liveContext, isTeacher }) {
  return (
    <div className={styles.headerRight}>
      <div className={styles.headerPlannerPanel}>
        <HeroStatusStrip attendancePct={attendancePct} classesCount={classesCount} deadlinesCount={deadlinesCount} upcomingSocietyEventsCount={upcomingSocietyEventsCount} tasksCount={tasksCount} isTeacher={isTeacher} />
        <OnNowCard liveContext={liveContext} />
      </div>
    </div>
  );
}

function HeroStatusStrip({ attendancePct, classesCount, deadlinesCount, upcomingSocietyEventsCount, tasksCount, isTeacher }) {
  const classRef = useCountUp(classesCount ?? 0, 1200);
  const taskRef = useCountUp(tasksCount ?? 0, 1200);
  const deadlineRef = useCountUp(deadlinesCount ?? 0, 1200);
  const societyRef = useCountUp(upcomingSocietyEventsCount ?? 0, 1200);
  const attendanceRef = useCountUp(attendancePct ?? 0, 1200);
  return (
    <StatStrip
      items={buildHeroStatItems({ attendancePct, attendanceRef, classesCount, classRef, deadlinesCount, deadlineRef, upcomingSocietyEventsCount, societyRef, tasksCount, taskRef, isTeacher })}
      className={styles.heroStatStrip}
      compact
      nowrap
    />
  );
}

function buildHeroStatItems({ attendancePct, attendanceRef, classesCount, classRef, deadlinesCount, deadlineRef, upcomingSocietyEventsCount, societyRef, tasksCount, taskRef, isTeacher }) {
  const deadlinesRoute = isTeacher ? "/modules?filter=all" : "/modules?filter=enrolled";
  const base = [
    { key: "classes", label: isTeacher ? "Teaching today" : "Classes today", value: classesCount ?? 0, valueRef: classRef, tooltip: "Lectures, labs, practicals, tutorials, and seminars on today's plan." },
    { key: "tasks", label: "Tasks to do", value: tasksCount ?? 0, valueRef: taskRef, to: HERO_STAT_ROUTES.tasks },
  ];
  if (isTeacher) {
    return [
      ...base,
      { key: "deadlines", label: "Teaching deadlines", value: deadlinesCount ?? 0, valueRef: deadlineRef, tone: (deadlinesCount ?? 0) > 0 ? "warning" : undefined, tooltip: "Upcoming deadlines across modules you teach.", to: deadlinesRoute },
    ];
  }
  return [
    ...base,
    { key: "deadlines", label: "Upcoming deadlines", value: deadlinesCount ?? 0, valueRef: deadlineRef, tone: (deadlinesCount ?? 0) > 0 ? "warning" : undefined, to: deadlinesRoute },
    { key: "society", label: "Upcoming societies", value: upcomingSocietyEventsCount ?? 0, valueRef: societyRef, tooltip: "Society events coming up over the next 14 days.", to: HERO_STAT_ROUTES.societies },
    { key: "attendance", label: "Attendance", value: attendancePct ?? 0, valueRef: attendanceRef, suffix: "%", tone: (attendancePct ?? 0) >= 75 ? "success" : "warning", tooltip: "View my attendance", to: "/attendance" },
  ];
}

function OnNowCard({ liveContext }) {
  const isWarning = liveContext?.tone === "warning";
  return (
    <motion.div
      className={[styles.nextStepCard, isWarning ? styles.nextStepCardWarning : ""].filter(Boolean).join(" ")}
      animate={isWarning ? {
        boxShadow: [
          "0 0 0 1px rgba(185, 65, 42, 0.12), 0 8px 18px rgba(185, 65, 42, 0.06)",
          "0 0 0 1px rgba(185, 65, 42, 0.2), 0 0 20px rgba(185, 65, 42, 0.14)",
          "0 0 0 1px rgba(185, 65, 42, 0.12), 0 8px 18px rgba(185, 65, 42, 0.06)",
        ],
      } : { boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)" }}
      transition={isWarning ? { duration: 2.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
    >
      <div className={styles.nextStepTop}>
        <span className={styles.nextStepLabel}>{liveContext?.label || "On Now"}</span>
        <motion.span
          className={styles.nextStepDot}
          aria-hidden
          animate={{ scale: [1, 1.18, 1], opacity: [0.72, 1, 0.72] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className={styles.nextStepText}>{liveContext?.text || "Nothing on right now."}</p>
      {liveContext?.meta && <span className={styles.nextStepMeta}>{liveContext.meta}</span>}
    </motion.div>
  );
}

export default IntelligenceHero;
