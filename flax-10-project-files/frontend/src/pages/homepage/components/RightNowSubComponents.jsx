/**
 * Right Now card primitives.
 */

import React from "react";
import { motion } from "framer-motion";
import { Train, AlertTriangle, X, MapPinned, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import styles from "./RightNowWidget.module.css";
import { getTimeLeftBand, getJourneySummary } from "./rightNowUtils";

export const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.23, 1, 0.32, 1] },
});

export const ActiveEventCard = ({ currentBlock, timeRangeStr, timeLeftStr, currentProgressPct }) => {
  const minutesLeft = currentBlock?.end_time
    ? Math.max(0, Math.floor((new Date(currentBlock.end_time).getTime() - Date.now()) / 60000))
    : null;
  const band = getTimeLeftBand(minutesLeft);
  const color = band === "under10" ? "var(--home-urgency-danger)" : band === "10to30" ? "var(--home-urgency-warning)" : "var(--sage)";

  return (
    <motion.div className={styles.currentEventCard} {...fadeIn(0.07)}>
      <EventTitleRow title={currentBlock.title} timeLeftStr={timeLeftStr} color={color} />
      <EventProgressRow timeRangeStr={timeRangeStr} currentProgressPct={currentProgressPct} />
    </motion.div>
  );
};

const EventTitleRow = ({ title, timeLeftStr, color }) => (
  <div className={styles.currentEventRow1}>
    <span className={styles.currentEventTitle}>{title}</span>
    {timeLeftStr && <span className={styles.currentEventTimeLeft} style={{ color }}>{timeLeftStr}</span>}
  </div>
);

const EventProgressRow = ({ timeRangeStr, currentProgressPct }) => (
  <div className={styles.currentEventRow2}>
    <span className={styles.currentEventTimeRange}>{timeRangeStr}</span>
    {currentProgressPct != null && <ProgressBar pct={currentProgressPct} />}
  </div>
);

const ProgressBar = ({ pct }) => (
  <div className={styles.progressTrack}>
    <motion.div className={styles.progressFill} initial={{ width: "0%" }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }} />
  </div>
);

export const TflDelayCard = ({ leaveByInfo, onDismiss }) => (
  <motion.div className={styles.alertPill} {...fadeIn(0.14)} layout>
    <Train size={13} strokeWidth={2} className={styles.alertIcon} aria-hidden />
    <span className={styles.alertText}>{leaveByInfo.message}</span>
    <DismissButton onDismiss={onDismiss} label="Dismiss delay alert" />
  </motion.div>
);

const DismissButton = ({ onDismiss, label }) => (
  <button type="button" className={styles.alertDismiss} onClick={onDismiss} aria-label={label}>
    <X size={12} strokeWidth={2} />
  </button>
);

export const ConflictSummary = ({ conflicts, onDismiss }) => {
  const first = conflicts[0];
  const time = first?.a?.start_time ? new Date(first.a.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : null;
  const label = time
    ? `Warning: Schedule overlap at ${time}`
    : `${conflicts.length} schedule overlap${conflicts.length === 1 ? "" : "s"} today`;

  return (
    <motion.div className={styles.alertPill} {...fadeIn(0.12)}>
      <AlertTriangle size={12} strokeWidth={2} className={styles.alertIconWarn} aria-hidden />
      <span className={styles.alertTextWarn}>{label}</span>
      <DismissButton onDismiss={onDismiss} label="Dismiss warning" />
    </motion.div>
  );
};

export const CommuteContextCard = ({ campus, journey, loading, leaveByInfo }) => {
  const summary = getJourneySummary(journey);
  const lead = leaveByInfo?.leaveByStr
    ? `Leave by ${leaveByInfo.leaveByStr}`
    : summary?.duration
      ? `${summary.duration} from home`
      : "Check travel";

  return (
    <motion.div className={styles.contextCard} {...fadeIn(0.22)}>
      <CommuteHeader />
      <p className={styles.contextCardTitle}>{campus?.shortName || "Campus"} commute</p>
      <p className={styles.contextCardText}>{loading ? "Checking route..." : `${lead}${campus ? ` for ${campus.name}` : ""}.`}</p>
      {!loading && <CommutePills lines={summary?.lines} />}
    </motion.div>
  );
};

const CommuteHeader = () => (
  <div className={styles.contextCardHeader}>
    <div className={styles.contextCardTitleRow}>
      <MapPinned size={14} strokeWidth={1.8} className={styles.contextCardIcon} aria-hidden />
      <span className={styles.contextCardEyebrow}>Travel context</span>
    </div>
    <Link to="/map" className={styles.contextCardLink}>Open map <ArrowUpRight size={12} strokeWidth={1.8} aria-hidden /></Link>
  </div>
);

const CommutePills = ({ lines = [] }) => lines.length > 0 && (
  <div className={styles.contextPills}>
    {lines.map((line) => <span key={line} className={styles.contextPill}>{line}</span>)}
  </div>
);
