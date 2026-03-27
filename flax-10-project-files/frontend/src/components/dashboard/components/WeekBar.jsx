// src/components/WeekBar.jsx
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/dashboard/components/WeekBar.jsx
import styles from "../styles/WeekBar.module.css";
import { loadTermConfig } from "../../../lib/termConfig";
import { buildWeekLabels, getWeekIndexForDate } from "../../calendar/utils/weekUtils";
=======
import styles from "./WeekBar.module.css";
import { loadTermConfig } from "../../lib/termConfig";
import { buildWeekLabels, getWeekIndexForDate } from "../calendar/utils/weekUtils";
>>>>>>> main:flax-10-project-files/frontend/src/components/dashboard/WeekBar.jsx

// Badge component that shows the current week or reading week status, and the total number of weeks in the term
function WeekBadge({ label, totalWeeks, isReadingWeek }) {
  return (
    <div className={styles.badgeWrap}>
      <span
        className={`${styles.badge} ${isReadingWeek ? styles.badgeReading : styles.badgeNormal
          }`}
      >
        {label}
      </span>
      <span className={styles.badgeSub}>of {totalWeeks}</span>
    </div>
  );
}

function WeekSegment({ label, isCurrent, isPast }) {
  const barClass = buildBarClass(isCurrent, isPast);
  const labelClass = buildLabelClass(isCurrent);
  return (
    <div className={styles.segment}>
      <div className={barClass} />
      <span className={labelClass}>{label}</span>
    </div>
  );
}

function buildBarClass(isCurrent, isPast) {
  return [styles.segmentBar, isCurrent && styles.segmentCurrent, isPast && styles.segmentPast]
    .filter(Boolean).join(" ");
}

function buildLabelClass(isCurrent) {
  return `${styles.segmentLabel} ${isCurrent ? styles.segmentLabelActive : ""}`;
}

// Main component that renders the week bar, showing the current week, reading week status, and total weeks in the term
export default function WeekBar({ date }) {
  const cfg = loadTermConfig();
  const labels = buildLabels(cfg);
  const currentIdx = getWeekIndexForDate(date, cfg);
  const isReadingWeek = checkReadingWeek(labels, currentIdx);
  const badgeLabel = getBadgeLabel(labels, currentIdx, isReadingWeek, cfg);

  return (
    <div className={styles.container}>
      <WeekBadge label={badgeLabel} totalWeeks={cfg.totalWeeks} isReadingWeek={isReadingWeek} />
      <WeekTrack labels={labels} currentIdx={currentIdx} />
    </div>
  );
}

// Builds the labels for the week bar based on the term configuration, including handling reading week if applicable
function buildLabels(cfg) {
  return buildWeekLabels(
    cfg.totalWeeks,
    cfg.hasReadingWeek,
    cfg.readingWeekAfterWeek
  );
}

// Checks if the current index corresponds to a reading week based on the labels array
function checkReadingWeek(labels, idx) {
  return idx >= 0 && labels[idx] === "RW";
}

// Determines the label to show in the badge based on the current index and whether it's a reading week
function getBadgeLabel(labels, idx, isRW) {
  if (idx < 0) return "Semester hasn't started";
  if (isRW) return "Reading Week";
  return `Week ${labels[idx]}`;
}

// Component that renders the track of week segments, highlighting the current week and past weeks based on the current index
function WeekTrack({ labels, currentIdx }) {
  return (
    <div className={styles.track}>
      {labels.map(renderWeekSegment(currentIdx))}
    </div>
  );
}

// Helper function that returns a function to render each week segment, determining if it's the current week or a past week based on the index
function renderWeekSegment(currentIdx) {
  return function (label, i) {
    return (
      <WeekSegment
        key={i}
        label={label}
        isCurrent={i === currentIdx}
        isPast={i < currentIdx}
      />
    );
  };
}
