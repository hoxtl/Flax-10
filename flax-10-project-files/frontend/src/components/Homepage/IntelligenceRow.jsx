import React, { useRef, useEffect, useState } from "react";
import { CheckSquare, TrendingUp, AlertCircle, Zap, Clock } from "lucide-react";
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
  slot1ActionHub,
  slot2Health,
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
          {statusStrip && (
            <div className={`${styles.statusStrip} ${styles[`statusStrip${statusStrip.variant}`]}`}>
              <span className={styles.statusStripDot} aria-hidden />
              <span className={styles.statusStripText}>{statusStrip.text}</span>
            </div>
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
          span={styles.span2}
          title="Day Progress"
          meta="Completion"
          icon={TrendingUp}
          index={1}
          isVisible={sectionVisible}
          centeredBody
        >
          {slot2Health}
        </BentoSlot>

        <BentoSlot
          span={styles.span3}
          title="Deadlines"
          meta="Upcoming"
          icon={AlertCircle}
          index={2}
          isVisible={sectionVisible}
        >
          {slot3Urgent}
        </BentoSlot>

        <BentoSlot
          span={styles.span4}
          title="Focus Windows"
          meta="Today"
          icon={Zap}
          index={3}
          isVisible={sectionVisible}
        >
          {slot4Energy}
        </BentoSlot>

        <BentoSlot
          span={styles.span5}
          title="Right Now"
          meta="Schedule"
          icon={Clock}
          index={4}
          isVisible={sectionVisible}
        >
          {slot5Commute}
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
