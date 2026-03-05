import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, AlertTriangle, Train, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./IntelligenceRow.module.css";
import { tflService } from "../../../api/tflService";
import { RightNowWidget } from "./RightNowWidget";
import { BentoGrid, BentoCard } from "../../../components/ui/bento-grid";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { SocialDiscoverWidget } from "./SocialDiscoverWidget";
import { StudyPulseWidget } from "./StudyPulseWidget";

function getGreeting(name) {
  const h = new Date().getHours();
  const timeOfDay = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return `Good ${timeOfDay}${name ? `, ${name}` : ""}.`;
}

function getTodayLabel() {
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase();
  const date = now.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
  return `${day} · ${date}`;
}

function useTflDelays() {
  const [delays, setDelays] = useState(undefined);
  useEffect(() => {
    tflService.getTfLDelays()
      .then(data => setDelays(Array.isArray(data) ? data : []))
      .catch(() => setDelays([]));
  }, []);
  return delays;
}

export default function IntelligenceRow({
  displayName,
  statusStrip,
  tflContext,
  slot1TodayTasks,
  slot3Urgent,
  studyPulseWindows,
  studyPulseNow,
  studyPulseOnStartFocus,
  studyPulseDeadlines,
  slot5Commute,
  slot5Data,
}) {
  const tflDelays = useTflDelays();
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <header className={styles.header}>
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
          >
            {getGreeting(displayName)}
          </motion.h2>
        </div>
      </header>

      <BentoGrid>
        {/* Col 1, Rows 1–2: Right Now — hero card */}
        <BentoCard className={styles.posRightNow}>
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
        </BentoCard>

        {/* Cols 2–3, Row 1: Today's Tasks — wide */}
        <BentoCard className={styles.posTodaysTasks}>
          {slot1TodayTasks}
        </BentoCard>

        {/* Col 2, Row 2: Quick Actions */}
        <BentoCard className={styles.posQuickActions}>
          <QuickActionsWidget />
        </BentoCard>

        {/* Col 3, Row 2: Social Discover */}
        <BentoCard className={styles.posSocialDiscover}>
          <SocialDiscoverWidget />
        </BentoCard>

        {/* Col 1, Row 3: Upcoming Deadlines */}
        <BentoCard className={styles.posDeadlines}>
          {slot3Urgent}
        </BentoCard>

        {/* Cols 2–3, Row 3: Study Pulse (focus windows + weekly progress) */}
        <BentoCard className={styles.posStudyPulse}>
          <StudyPulseWidget
            windows={studyPulseWindows ?? []}
            now={studyPulseNow ?? new Date()}
            onStartFocus={studyPulseOnStartFocus}
            deadlines={studyPulseDeadlines ?? []}
          />
        </BentoCard>
      </BentoGrid>
    </section>
  );
}

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
