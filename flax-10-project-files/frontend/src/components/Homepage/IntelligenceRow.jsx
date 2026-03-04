import React, { useRef, useEffect, useState } from "react";
import { CheckSquare, AlertCircle, Zap, Clock, Calendar, Train, X, AlertTriangle, Check, ClipboardList } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../api/tflService";
import { RightNowWidget } from "../../pages/Homepage/components/RightNowWidget";

/** Dynamic greeting by time of day */
function getGreeting(name) {
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}.`;
}

/** Today's date label e.g. "WEDNESDAY · 4 MAR" */
function getTodayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
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
  slot5Data,
  hasOverdue = false,
}) {
  const sectionRef = useRef(null);
  const [sectionVisible, setSectionVisible] = useState(false);
  const tflDelays = useTflDelays();
  const navigate = useNavigate();

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
          <span className={styles.headerDateRow}>
            <Calendar className={styles.headerDateIcon} size={14} strokeWidth={2} aria-hidden />
            <span className={styles.headerLabel}>{getTodayLabel()}</span>
          </span>
          <h2 className={styles.headerTitle}>{getGreeting(displayName)}</h2>
        </div>
      </header>

      <div className={styles.grid}>
        <BentoSlot
          span={styles.span5}
          slotVariant="rightNow"
          title="Right Now"
          meta={null}
          icon={Clock}
          index={0}
          isVisible={sectionVisible}
        >
          {slot5Data ? (
            <RightNowWidget
              {...slot5Data}
              tflDelays={tflDelays}
              onOpenTimer={() => navigate("/timer")}
            />
          ) : (
            <>
              {statusStrip?.variant === "Conflict" && statusStrip?.text?.includes("Schedule overlap") && (
                <div className={styles.rightNowScheduleWarning} role="alert">
                  <AlertTriangle size={16} strokeWidth={2} aria-hidden />
                  <span>{statusStrip.text}</span>
                </div>
              )}
              {slot5Commute}
              <TravelAlertsSection tflContext={tflContext} />
            </>
          )}
        </BentoSlot>

        <BentoSlot
          span={styles.span1}
          slotVariant="tasks"
          title="Today's Tasks"
          meta={slot1Meta}
          icon={CheckSquare}
          iconPulse={hasOverdue}
          index={1}
          isVisible={sectionVisible}
        >
          {slot1ActionHub}
        </BentoSlot>

        <BentoSlot
          span={styles.span3}
          slotVariant="deadlines"
          title="Upcoming Deadlines"
          meta={null}
          icon={ClipboardList}
          index={2}
          isVisible={sectionVisible}
        >
          {slot3Urgent}
        </BentoSlot>

        <BentoSlot
          span={styles.span4}
          slotVariant="focus"
          title="Focus Windows"
          meta={null}
          icon={Zap}
          index={3}
          isVisible={sectionVisible}
        >
          {slot4Energy}
        </BentoSlot>
      </div>
    </section>
  );
}

function BentoSlot({
  span,
  slotVariant,
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

  const variantClass = slotVariant ? styles[`bentoSlotVariant${slotVariant.charAt(0).toUpperCase()}${slotVariant.slice(1)}`] : null;

  return (
    <article
      ref={cardRef}
      className={`${styles.bentoSlot} ${span} ${variantClass || ""} ${isVisible ? styles.bentoVisible : ""} ${iconPulse ? styles.iconPulse : ""}`}
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

/** Right Now: TFL Travel Alerts section — always visible, header + all-clear or line disruptions */
function TravelAlertsSection({ tflContext }) {
  const delays = useTflDelays();
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded, setExpanded] = useState(false);

  const visible = delays && delays.length > 0 ? delays.filter(d => !dismissed.has(d.lineName)) : [];
  const INITIAL_SHOW = 3;
  const showCollapseToggle = visible.length > INITIAL_SHOW;
  const displayed = showCollapseToggle && !expanded ? visible.slice(0, INITIAL_SHOW) : visible;
  const hiddenCount = visible.length - displayed.length;

  const dismiss = (lineName) => setDismissed(prev => new Set([...prev, lineName]));

  return (
    <div className={styles.rightNowTflSection}>
      <div className={styles.rightNowTflHeader}>
        <div className={styles.rightNowTflRoundel} aria-hidden>
          <Train size={14} strokeWidth={2.5} />
        </div>
        <span className={styles.rightNowTflTitle}>Travel alerts</span>
      </div>
      {delays === undefined && (
        <p className={styles.rightNowTflLoading}>Checking…</p>
      )}
      {delays && delays.length === 0 && (
        <div className={styles.rightNowTflAllGood}>
          <Check size={16} strokeWidth={2.5} aria-hidden />
          <span>All lines running normally</span>
        </div>
      )}
      {visible.length > 0 && (
        <>
          <div className={styles.rightNowTflList} role="list">
            {displayed.map((delay) => (
              <div key={delay.lineName} className={styles.rightNowTflLineRow} role="listitem">
                <span
                  className={styles.rightNowTflLineDot}
                  style={{ background: delay.color }}
                  aria-hidden
                />
                <span className={styles.rightNowTflLineName}>{delay.lineName}</span>
                <span className={styles.rightNowTflLineSep}>·</span>
                <span className={styles.rightNowTflLineStatus}>{delay.severityDescription}</span>
                <button
                  type="button"
                  className={styles.rightNowTflLineDismiss}
                  onClick={() => dismiss(delay.lineName)}
                  aria-label={`Dismiss ${delay.lineName} alert`}
                >
                  <X size={12} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            ))}
          </div>
          {showCollapseToggle && (
            <button
              type="button"
              className={styles.rightNowTflCollapseToggle}
              onClick={() => setExpanded(e => !e)}
            >
              {expanded ? "Show less" : `Show ${hiddenCount} more alert${hiddenCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

