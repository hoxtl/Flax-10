// src/components/WeekBar.jsx
import styles from "./WeekBar.module.css";
import { loadTermConfig } from "../lib/termConfig";
import { buildWeekLabels, getWeekIndexForDate } from "../lib/weekUtils";

function WeekBadge({ label, totalWeeks, isReadingWeek }) {
  return (
    <div className={styles.badgeWrap}>
      <span
        className={`${styles.badge} ${
          isReadingWeek ? styles.badgeReading : styles.badgeNormal
        }`}
      >
        {label}
      </span>
      <span className={styles.badgeSub}>of {totalWeeks}</span>
    </div>
  );
}

function WeekSegment({ label, isCurrent, isPast }) {
  const barClass = [
    styles.segmentBar,
    isCurrent && styles.segmentCurrent,
    isPast && styles.segmentPast,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.segment}>
      <div className={barClass} />
      <span
        className={`${styles.segmentLabel} ${
          isCurrent ? styles.segmentLabelActive : ""
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function WeekBar({ date }) {
  // Load user-specific term config (localStorage for now)
  const cfg = loadTermConfig();

  const labels = buildWeekLabels(
    cfg.totalWeeks,
    cfg.hasReadingWeek,
    cfg.readingWeekAfterWeek
  );

  const currentIdx = getWeekIndexForDate(date, cfg);
  const isReadingWeek = labels[currentIdx] === "RW";

  const badgeLabel =
    currentIdx < 0
      ? "Semester hasn't started"
      : isReadingWeek
      ? "Reading Week"
      : `Week ${labels[currentIdx]}`;

  return (
    <div className={styles.container}>
      <WeekBadge
        label={badgeLabel}
        totalWeeks={cfg.totalWeeks}
        isReadingWeek={isReadingWeek}
      />

      <div className={styles.track}>
        {labels.map((label, i) => (
          <WeekSegment
            key={i}
            label={label}
            isCurrent={i === currentIdx}
            isPast={i < currentIdx}
          />
        ))}
      </div>
    </div>
  );
}
