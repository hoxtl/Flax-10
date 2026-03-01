import React, { useRef, useEffect, useState } from "react";
import { CheckSquare, AlertCircle, Zap, Clock, Train, X } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";

/** Dynamic greeting by time of day */
function getGreeting(name) {
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}.`;
}

/** Today's date label e.g. "Friday · 27 Feb" */
function getTodayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "long" });
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${day} · ${date}`;
}

export default function IntelligenceRow({
  displayName,
  taskCount = 0,
  statusStrip,
  scheduleInsight,
  tflContext,
  slot1ActionHub,
  daySummary,
  slot3Urgent,
  slot4Energy,
  slot5Commute,
  hasOverdue = false,
}) {
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSectionVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const dailyPulse =
    taskCount === 0
      ? "All clear. Ready to wrap up?"
      : taskCount === 1
        ? "1 task remaining today."
        : `${taskCount} tasks remaining today.`;

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${sectionVisible ? styles.sectionVisible : ""}`}
    >
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerLabel}>{getTodayLabel()}</span>
          <h2 className={styles.headerTitle}>{getGreeting(displayName)}</h2>
          {daySummary && (
            <div className={styles.headerDayProgress}>
              <div className={styles.headerDayProgressTrack}>
                <div
                  className={styles.headerDayProgressFill}
                  style={{ width: `${Math.min(daySummary.pct, 100)}%` }}
                />
              </div>
              <div className={styles.headerDayProgressMeta}>
                <span className={styles.headerDayProgressCount}>
                  {daySummary.done}/{daySummary.total} done · {daySummary.pct}%
                </span>
                {daySummary.overdue > 0 && (
                  <span className={styles.headerDayProgressOverdue}>
                    ⚠ {daySummary.overdue} overdue
                  </span>
                )}
                {daySummary.streak > 0 && (
                  <span className={styles.headerDayProgressStreak}>
                    🔥 {daySummary.streak}d streak
                  </span>
                )}
              </div>
            </div>
          )}
          {scheduleInsight && (
            <p className={styles.scheduleInsight}>{scheduleInsight}</p>
          )}
        </div>
        <div className={styles.headerRight}>
          <p className={styles.headerSubtitle}>{dailyPulse}</p>
        </div>
      </header>

      <div className={styles.grid}>
        <BentoSlot
          span={styles.span1}
          title="Today's Tasks"
          meta="Action Hub"
          icon={CheckSquare}
          iconPulse={hasOverdue}
          index={0}
          isVisible={sectionVisible}
        >
          {slot1ActionHub}
        </BentoSlot>

        <BentoSlot
          span={styles.span3}
          title="Deadlines"
          meta="Upcoming"
          icon={AlertCircle}
          index={1}
          isVisible={sectionVisible}
        >
          {slot3Urgent}
        </BentoSlot>

        <BentoSlot
          span={styles.span4}
          title="Focus Windows"
          meta="Today"
          icon={Zap}
          index={2}
          isVisible={sectionVisible}
        >
          {slot4Energy}
        </BentoSlot>

        <BentoSlot
          span={styles.span5}
          title="Right Now"
          meta="Schedule"
          icon={Clock}
          index={3}
          isVisible={sectionVisible}
        >
          <>
            <div className={styles.rightNowPillsRow}>
              {statusStrip && (
                <div className={`${styles.statusStrip} ${styles[`statusStrip${statusStrip.variant}`]}`}>
                  <span className={styles.statusStripDot} aria-hidden />
                  <span className={styles.statusStripText}>{statusStrip.text}</span>
                </div>
              )}
              <TravelAlertPill tflContext={tflContext} />
            </div>
            {slot5Commute}
          </>
        </BentoSlot>
      </div>
    </section>
  );
}

function BentoSlot({
  span,
  title,
  meta,
  icon: Icon,
  iconPulse = false,
  index,
  isVisible,
  centeredBody = false,
  children,
}) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: "50%", y: "50%" });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x: `${x}%`, y: `${y}%` });
  };

  const handleMouseLeave = () => setMousePos({ x: "50%", y: "50%" });

  return (
    <article
      ref={cardRef}
      className={`${styles.bentoSlot} ${span} ${isVisible ? styles.bentoVisible : ""} ${iconPulse ? styles.iconPulse : ""}`}
      style={{ animationDelay: `${index * 0.12}s` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={styles.bentoGlow}
        style={{ ["--x"]: mousePos.x, ["--y"]: mousePos.y }}
        aria-hidden
      />
      <div className={styles.bentoContent}>
        <div className={styles.bentoTop}>
          <div className={`${styles.bentoIconWrap} ${iconPulse ? styles.bentoIconOverdue : ""}`}>
            <Icon className={styles.bentoIcon} strokeWidth={1.5} aria-hidden />
          </div>
          <div className={styles.bentoHeader}>
            <h3 className={styles.bentoTitle}>{title}</h3>
            {meta && <span className={styles.bentoMeta}>{meta}</span>}
          </div>
        </div>
        <div className={`${styles.bentoBody} ${centeredBody ? styles.bentoCenteredBody : ""}`}>{children}</div>
      </div>
    </article>
  );
}

// TODO: Replace MOCK_TFL_ALERT with real data from Dian's tfl/delays branch
const MOCK_TFL_ALERT = {
  line: "Northern Line",
  status: "Minor delays",
  suggestion: "Leave 10 min early for your 09:00 lecture",
};

// TODO: Replace MOCK_TFL_ALERT with real data from Dian's tfl/delays branch
function TravelAlertPill({ tflContext }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const message = tflContext
    ? `${MOCK_TFL_ALERT.line}: ${MOCK_TFL_ALERT.status} — leave by ${tflContext.leaveStr} for ${tflContext.eventTitle}`
    : `${MOCK_TFL_ALERT.line} · ${MOCK_TFL_ALERT.status}`;
  return (
    <div className={`${styles.statusStrip} ${styles.statusStripTfl}`} role="status">
      <Train size={11} strokeWidth={2} aria-hidden />
      <span className={styles.statusStripText}>{message}</span>
      <button
        className={styles.statusStripPillDismiss}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss travel alert"
      >
        <X size={10} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}

