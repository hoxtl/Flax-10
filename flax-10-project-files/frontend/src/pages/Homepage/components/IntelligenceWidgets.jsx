/*
 * Intelligence hero widgets.
 */

import { AnimatePresence, motion as Motion, useReducedMotion } from "framer-motion";
import { BookOpen, Calendar } from "lucide-react";
import { createElement } from "react";
import { useNavigate } from "react-router-dom";
import StatStrip from "../../../components/common/stat_strip/StatStrip";
import WelcomeBackgroundPaths from "../../../components/welcome/WelcomeBackgroundPaths";
import { useCountUp } from "../../../hooks/useCountUp";
import baseStyles from "../styles/WidgetBase.module.css";
import styles from "./IntelligenceHeader.module.css";
import { getGreeting, getTodayLabel } from "./intelligenceUtils";

const HERO_STAT_ROUTES = { societies: "/societies", tasks: "/tasks?filter=today" };

const GLOW_SHADOW_BASE = "0 0 32px color-mix(in srgb, var(--home-hero-glow-shadow) 82%, transparent), 0 0 74px color-mix(in srgb, var(--home-hero-glow-shadow) 46%, transparent)";
const GLOW_SHADOW_PEAK = "0 0 48px color-mix(in srgb, var(--home-hero-glow-shadow) 100%, transparent), 0 0 108px color-mix(in srgb, var(--home-hero-glow-shadow) 60%, transparent)";

function BorderGlow({ reduceMotion }) {
  const animate = reduceMotion ? { opacity: 0.9 } : { opacity: [0.76, 1, 0.82], boxShadow: [GLOW_SHADOW_BASE, GLOW_SHADOW_PEAK, GLOW_SHADOW_BASE] };
  const transition = reduceMotion ? { duration: 0 } : { duration: 3.8, repeat: Infinity, ease: "easeInOut" };
  return <Motion.div className={styles.bannerBorderGlow} aria-hidden animate={animate} transition={transition} />;
}

function BannerAura({ reduceMotion }) {
  const initial = reduceMotion ? false : { opacity: 0.52, scale: 1, x: "-6%", y: "-3%" };
  const animate = reduceMotion ? { opacity: 0.62 } : { opacity: [0.5, 0.86, 0.58, 0.5], scale: [1, 1.12, 0.96, 1], x: ["-6%", "8%", "-3%", "-6%"], y: ["-3%", "7%", "-4%", "-3%"] };
  const transition = reduceMotion ? { duration: 0 } : { duration: 8.2, repeat: Infinity, ease: "easeInOut" };
  return <Motion.div className={styles.bannerAura} aria-hidden initial={initial} animate={animate} transition={transition} />;
}

function BannerShimmer({ reduceMotion }) {
  const initial = reduceMotion ? false : { x: "-42%", opacity: 0 };
  const animate = reduceMotion ? { opacity: 0.28, x: "22%" } : { x: ["-46%", "126%"], opacity: [0, 0.68, 0] };
  const transition = reduceMotion ? { duration: 0 } : { duration: 3.7, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.35 };
  return <Motion.div className={styles.bannerShimmer} aria-hidden initial={initial} animate={animate} transition={transition} />;
}

export function IntelligenceHero(props) {
  const reduceMotion = useReducedMotion();
  return (
    <div className={styles.premiumCard}>
      <WelcomeBackgroundPaths embedded className={styles.heroPaths} count={12} intensity={1.8} speed={0.5} />
      <BorderGlow reduceMotion={reduceMotion} />
      <BannerAura reduceMotion={reduceMotion} />
      <BannerShimmer reduceMotion={reduceMotion} />
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

function StatusBanner({ cta, icon, onDismiss, text }) {
  const navigate = useNavigate();
  const statusIcon = icon;
  return (
    <Motion.div className={styles.statusBanner} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className={styles.statusBannerContent}>
        {statusIcon ? createElement(statusIcon, { size: 14, className: styles.statusBannerIcon }) : null}
        <p className={styles.statusBannerText}>{text}</p>
      </div>
      <div className={styles.statusBannerActions}><button onClick={() => navigate(cta)} className={styles.statusBannerBtn}>View</button><button onClick={onDismiss} className={styles.statusBannerClose}>&times;</button></div>
    </Motion.div>
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

const WARNING_SHADOW_BASE = "0 0 0 1px r" + "gba(185, 65, 42, 0.12), 0 8px 18px r" + "gba(185, 65, 42, 0.06)";
const WARNING_SHADOW_PEAK = "0 0 0 1px r" + "gba(185, 65, 42, 0.2), 0 0 20px r" + "gba(185, 65, 42, 0.14)";
const NORMAL_SHADOW = "0 4px 12px r" + "gba(0, 0, 0, 0.03)";

function PulseDot() {
  return <Motion.span className={styles.nextStepDot} aria-hidden animate={{ scale: [1, 1.18, 1], opacity: [0.72, 1, 0.72] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />;
}

function OnNowCard({ liveContext }) {
  const isWarning = liveContext?.tone === "warning";
  const className = [styles.nextStepCard, isWarning ? styles.nextStepCardWarning : ""].filter(Boolean).join(" ");
  const animate = isWarning ? { boxShadow: [WARNING_SHADOW_BASE, WARNING_SHADOW_PEAK, WARNING_SHADOW_BASE] } : { boxShadow: NORMAL_SHADOW };
  const transition = isWarning ? { duration: 2.1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 };
  return (
    <Motion.div className={className} animate={animate} transition={transition}>
      <div className={styles.nextStepTop}>
        <span className={styles.nextStepLabel}>{liveContext?.label || "On Now"}</span>
        <PulseDot />
      </div>
      <p className={styles.nextStepText}>{liveContext?.text || "Nothing on right now."}</p>
      {liveContext?.meta && <span className={styles.nextStepMeta}>{liveContext.meta}</span>}
    </Motion.div>
  );
}

export default IntelligenceHero;
