/*
 * Attendance prompt modal — custom layout with KCL branding, progress ring, and animated glow border.
 */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useAttendanceStats } from "../../pages/Attendance/hooks/useAttendanceStats";
import { computeAttendancePct } from "../../pages/Attendance/utils/attendanceSummary";
import styles from "./AttendancePromptModal.module.css";

function KclLogo() {
  return (
    <svg width="50" height="38" viewBox="0 0 100 76" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="King's College London">
      <rect width="100" height="76" rx="3" fill="#C8102E" />
      <text x="50" y="22" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontSize="19" fontWeight="bold" fill="white" letterSpacing="1.5">KING'S</text>
      <text x="50" y="44" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontSize="15" fontStyle="italic" fill="white" letterSpacing="0.5">College</text>
      <text x="50" y="62" textAnchor="middle" fontFamily="Georgia,'Times New Roman',serif" fontSize="17" fontWeight="bold" fill="white" letterSpacing="1.5">LONDON</text>
      <line x1="10" y1="68" x2="90" y2="68" stroke="white" strokeWidth="1.5" />
      <line x1="10" y1="72" x2="90" y2="72" stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function ringColor(pct) {
  if (pct >= 70) return "#22c55e";
  if (pct >= 50) return "#f97316";
  return "#ef4444";
}

function AttendanceRing({ pct }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const color = ringColor(pct);

  return (
    <div className={styles.ringWrap}>
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border, #e5e7eb)" strokeWidth="7" />
        <motion.circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: "easeOut", delay: 0.15 }}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className={styles.ringLabel}>
        <motion.span
          className={styles.ringPct}
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          {pct}%
        </motion.span>
        <span className={styles.ringSub}>attended</span>
      </div>
    </div>
  );
}

const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 0 2px #dc2626, 0 0 18px 5px rgba(220,38,38,0.28), 0 16px 48px rgba(0,0,0,0.28)",
      "0 0 0 2px #dc2626, 0 0 30px 10px rgba(220,38,38,0.48), 0 16px 48px rgba(0,0,0,0.28)",
      "0 0 0 2px #dc2626, 0 0 18px 5px rgba(220,38,38,0.28), 0 16px 48px rgba(0,0,0,0.28)",
    ],
  },
  transition: {
    duration: 2.2,
    repeat: Infinity,
    ease: "easeInOut",
    delay: 0.4,
  },
};

export default function AttendancePromptModal({ event, onAnswer, onDismiss }) {
  const { stats } = useAttendanceStats();
  const overall = stats?.overall ?? { attended: 0, missed: 0 };
  const pct = computeAttendancePct(overall);

  return createPortal(
    <div className={styles.backdrop} onMouseDown={onDismiss}>
      <motion.div
        className={styles.modal}
        onMouseDown={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0, ...glowPulse.animate }}
        transition={{
          opacity: { duration: 0.22, ease: "easeOut" },
          scale: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
          y: { duration: 0.25 },
          boxShadow: glowPulse.transition,
        }}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Attendance Tracker</h2>
          <div className={styles.headerActions}>
            <KclLogo />
            <button className={styles.closeBtn} onClick={onDismiss} type="button" aria-label="Close">
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <AttendanceRing pct={pct} />

        <div className={styles.eventPill}>{event.title}</div>

        <div className={styles.yesNoRow}>
          <button className={`${styles.btn} ${styles.btnYes}`} onClick={() => onAnswer(true)} type="button">Yes</button>
          <button className={`${styles.btn} ${styles.btnNo}`} onClick={() => onAnswer(false)} type="button">No</button>
        </div>

        <button className={`${styles.btn} ${styles.btnDismiss}`} onClick={onDismiss} type="button">Dismiss</button>
      </motion.div>
    </div>,
    document.body
  );
}
