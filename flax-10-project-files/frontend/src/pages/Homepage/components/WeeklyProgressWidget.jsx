import { motion } from "framer-motion";
import { TrendingUp, Flame } from "lucide-react";
import { useProfileSummary } from "../../Profile/hooks/useProfileSummary";
import styles from "./WeeklyProgressWidget.module.css";

const MOCK = { percentage: 72, hoursStudied: 9.6, hoursGoal: 20, streak: 4 };

const RING_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getRingColor(pct) {
  if (pct <= 25) return "#B87A6D";
  if (pct <= 50) return "#C4946D";
  if (pct <= 75) return "#C4A46D";
  return "#7BB38E";
}

const DAILY_DATA = [
  { day: "M", studied: 2.1, planned: 3 },
  { day: "T", studied: 1.8, planned: 3 },
  { day: "W", studied: 3.2, planned: 3 },
  { day: "T", studied: 2.5, planned: 3, isToday: true },
  { day: "F", studied: 0,   planned: 3, isFuture: true },
  { day: "S", studied: 0,   planned: 2, isFuture: true },
  { day: "S", studied: 0,   planned: 2, isFuture: true },
];

export function WeeklyProgressWidget() {
  const { summary, loading } = useProfileSummary();

  const weekly = !loading ? summary?.weekly : null;
  const streaks = !loading ? summary?.streaks : null;

  const pct          = weekly   ? Math.min(100, Math.max(0, Math.round(weekly.percentage ?? 0))) : MOCK.percentage;
  const hoursStudied = weekly   ? (weekly.hours_studied ?? MOCK.hoursStudied)                    : MOCK.hoursStudied;
  const hoursGoal    = weekly   ? (weekly.goal_hours    ?? MOCK.hoursGoal)                       : MOCK.hoursGoal;
  const streak       = streaks  ? (streaks.current      ?? MOCK.streak)                          : MOCK.streak;

  const ringColor = getRingColor(pct);
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <TrendingUp className={styles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
        <span className={styles.headerLabel}>This Week</span>
      </div>

      <div className={styles.ringWrapper}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className={styles.ring}
          aria-label={`${pct}% of weekly goal completed`}
          role="img"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            className={styles.ringTrack}
            strokeWidth={STROKE_WIDTH}
          />
          <motion.circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            className={styles.ringFill}
            strokeWidth={STROKE_WIDTH}
            stroke={ringColor}
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
          />
        </svg>
        <div className={styles.ringCenter}>
          <span className={styles.ringPct}>{pct}%</span>
        </div>
      </div>

      <p className={styles.ringSubtitle}>of planned hours completed</p>

      <div className={styles.statsRow}>
        <span className={styles.statsStudied}>{hoursStudied}h studied</span>
        <span className={styles.statsGoal}>{hoursGoal}h planned</span>
      </div>

      {streak > 0 && (
        <motion.div
          className={styles.streak}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          <Flame size={14} strokeWidth={1.75} className={styles.streakIcon} aria-hidden />
          <span>{streak}-day streak</span>
        </motion.div>
      )}

      {/* Daily breakdown */}
      <div className={styles.dailyBreakdown}>
        <span className={styles.dailyLabel}>Daily Breakdown</span>
        <div className={styles.dailyBars}>
          {DAILY_DATA.map((d, i) => {
            const pct = d.planned > 0 ? Math.min(1, d.studied / d.planned) : 0;
            return (
              <div key={i} className={styles.dailyRow}>
                <span className={styles.dailyDay}>{d.day}</span>
                <div className={styles.dailyBarTrack}>
                  {!d.isFuture && (
                    <motion.div
                      className={`${styles.dailyBarFill} ${d.isToday ? styles.dailyBarToday : ""}`}
                      style={{ width: `${pct * 100}%` }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{
                        duration: 0.4,
                        ease: [0.23, 1, 0.32, 1],
                        delay: 0.5 + i * 0.06,
                      }}
                    />
                  )}
                </div>
                <span className={styles.dailyHours}>
                  {d.isFuture ? "" : `${d.studied}h`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
