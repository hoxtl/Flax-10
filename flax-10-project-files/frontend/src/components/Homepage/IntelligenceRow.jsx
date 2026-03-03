import React, { useRef, useEffect, useState } from "react";
import { CheckSquare, AlertCircle, Zap, Clock, Train, X } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../api/tflService";

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
  slot1Meta,
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

  return (
    <section
      ref={sectionRef}
      className={`${styles.section} ${sectionVisible ? styles.sectionVisible : ""}`}
    >
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerLabel}>{getTodayLabel()}</span>
          <h2 className={styles.headerTitle}>{getGreeting(displayName)}</h2>
        </div>
      </header>

      <div className={styles.grid}>
        <BentoSlot
          span={styles.span1}
          title="Today's Tasks"
          meta={slot1Meta}
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
          meta={null}
          icon={AlertCircle}
          index={1}
          isVisible={sectionVisible}
        >
          {slot3Urgent}
        </BentoSlot>

        <BentoSlot
          span={styles.span4}
          title="Focus Windows"
          meta={null}
          icon={Zap}
          index={2}
          isVisible={sectionVisible}
        >
          {slot4Energy}
        </BentoSlot>

        <BentoSlot
          span={styles.span5}
          title="Right Now"
          meta={null}
          icon={Clock}
          index={3}
          isVisible={sectionVisible}
        >
          <>
            <div className={styles.intRowAlertsContainer}>
              {statusStrip && (
                <div className={styles.intRowAlertRow}>
                  <span className={styles.intRowAlertDot} aria-hidden />
                  <span className={styles.intRowAlertText}>{statusStrip.text}</span>
                </div>
              )}
              <TravelAlertPills tflContext={tflContext} compact />
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

function useTflDelays() {
  const [delays, setDelays] = useState(undefined); // undefined = loading
  useEffect(() => {
    tflService.getTfLDelays()
      .then(data => setDelays(Array.isArray(data) ? data : []))
      .catch(() => setDelays([]));
  }, []);
  return delays;
}

function TravelAlertPills({ tflContext, compact }) {
  const delays = useTflDelays();
  const [dismissed, setDismissed] = useState(new Set());

  if (!delays || delays.length === 0) return null;

  const visible = delays.filter(d => !dismissed.has(d.lineName));
  if (visible.length === 0) return null;

  const shown = visible.slice(0, 2);
  const overflow = visible.length - shown.length;

  const dismiss = (lineName) =>
    setDismissed(prev => new Set([...prev, lineName]));

  if (compact) {
    return (
      <>
        {shown.map((delay) => (
          <div key={delay.lineName} className={styles.intRowAlertRow} role="status">
            <span
              className={styles.intRowAlertDot}
              style={{ background: delay.color }}
              aria-hidden
            />
            <span className={styles.intRowAlertText}>
              {delay.lineName} · {delay.severityDescription}
            </span>
            <button
              className={styles.intRowAlertDismiss}
              onClick={() => dismiss(delay.lineName)}
              aria-label={`Dismiss ${delay.lineName} alert`}
            >
              <X size={9} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        ))}
        {overflow > 0 && (
          <span className={styles.intRowAlertOverflow}>
            +{overflow} more line{overflow > 1 ? "s" : ""} affected
          </span>
        )}
      </>
    );
  }

  return (
    <>
      {shown.map((delay) => {
        const isSevere = delay.severity < 5;
        return (
          <div
            key={delay.lineName}
            className={`${styles.tflCard} ${isSevere ? styles.tflCardSevere : ""}`}
            role="status"
          >
            <span
              className={styles.tflCardAccent}
              style={{ background: delay.color }}
              aria-hidden
            />
            <div className={styles.tflCardBody}>
              <div className={styles.tflCardTop}>
                <span className={styles.tflCardLine}>{delay.lineName}</span>
                <span className={styles.tflCardStatus}>{delay.severityDescription}</span>
              </div>
              {tflContext && (
                <span className={styles.tflCardLeave}>
                  Leave by {tflContext.leaveStr} for {tflContext.eventTitle}
                </span>
              )}
            </div>
            <button
              className={styles.tflCardDismiss}
              onClick={() => dismiss(delay.lineName)}
              aria-label={`Dismiss ${delay.lineName} alert`}
            >
              <X size={10} strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        );
      })}
      {overflow > 0 && (
        <span className={styles.tflOverflow}>
          +{overflow} more line{overflow > 1 ? "s" : ""} affected
        </span>
      )}
    </>
  );
}

