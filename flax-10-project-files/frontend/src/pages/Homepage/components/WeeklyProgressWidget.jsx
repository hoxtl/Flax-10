import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, Flame, ArrowRight, Zap, TrendingDown, CheckCircle2 } from "lucide-react";
import { useProfileSummary } from "../../Profile/hooks/useProfileSummary";
import analyticsService from "../../../api/analyticsService";
import styles from "./WeeklyProgressWidget.module.css";

const RING_SIZE = 64;
const STROKE_WIDTH = 5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MOCK_WEEKLY = { percentage: 48, hoursStudied: 9.6, hoursGoal: 20, streak: 4 };
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_SHORT  = ["M", "T", "W", "T", "F", "S", "S"];

function getDailyBarColor(pct, isToday) {
  if (isToday) return "#2c1810";
  if (pct >= 1)   return "#7BB38E";
  if (pct >= 0.5) return "#C4A46D";
  if (pct > 0)    return "#C4946D";
  return null;
}

function getRingColor(pct) {
  if (pct <= 25) return "#B87A6D";
  if (pct <= 50) return "#C4946D";
  if (pct <= 75) return "#C4A46D";
  return "#7BB38E";
}

function getInsight(hoursStudied, hoursGoal, pct, daysLeft) {
  const remaining = Math.max(0, hoursGoal - hoursStudied);
  if (remaining === 0 || pct >= 100) {
    return { icon: CheckCircle2, color: "#7BB38E", text: "Weekly goal reached — great work!" };
  }
  if (pct >= 80) {
    return { icon: Zap, color: "#C4A46D", text: `Just ${remaining.toFixed(1)}h to hit your goal` };
  }
  if (daysLeft <= 1) {
    return { icon: TrendingDown, color: "#B87A6D", text: `${remaining.toFixed(1)}h short of goal this week` };
  }
  const perDay = remaining / Math.max(1, daysLeft);
  return {
    icon: TrendingUp,
    color: "#A89279",
    text: `~${perDay.toFixed(1)}h/day needed to hit your goal`,
  };
}

function getTodayIndex() {
  const d = new Date().getDay(); // 0=Sun..6=Sat
  return d === 0 ? 6 : d - 1;   // Mon=0..Sun=6
}

function getDaysLeft() {
  const todayIdx = getTodayIndex();
  return 7 - todayIdx - 1; // days remaining after today
}

export function WeeklyProgressWidget() {
  const { summary, loading: profileLoading } = useProfileSummary();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    analyticsService
      .getSummary(7)
      .then(setAnalyticsData)
      .catch(() => setAnalyticsData(null))
      .finally(() => setAnalyticsLoading(false));
  }, []);

  const weekly  = !profileLoading ? summary?.weekly  : null;
  const streaks = !profileLoading ? summary?.streaks : null;

  const pct          = weekly  ? Math.min(100, Math.max(0, Math.round(weekly.percentage ?? 0))) : MOCK_WEEKLY.percentage;
  const hoursStudied = weekly  ? (weekly.hours_studied ?? MOCK_WEEKLY.hoursStudied)              : MOCK_WEEKLY.hoursStudied;
  const hoursGoal    = weekly  ? (weekly.goal_hours    ?? MOCK_WEEKLY.hoursGoal)                 : MOCK_WEEKLY.hoursGoal;
  const streak       = streaks ? (streaks.current      ?? MOCK_WEEKLY.streak)                    : MOCK_WEEKLY.streak;

  const ringColor  = getRingColor(pct);
  const dashOffset = CIRCUMFERENCE * (1 - pct / 100);
  const todayIdx   = getTodayIndex();
  const daysLeft   = getDaysLeft();
  const insight    = getInsight(hoursStudied, hoursGoal, pct, daysLeft);

  // Build daily bars from analytics daily_breakdown if available
  const rawDays = analyticsData?.daily_breakdown;
  const dailyBars = Array.from({ length: 7 }, (_, i) => {
    const isToday  = i === todayIdx;
    const isFuture = i > todayIdx;
    if (rawDays && rawDays[i]) {
      const d = rawDays[i];
      const studied = d.hours_studied ?? d.actual_hours ?? 0;
      const planned = d.planned_hours ?? d.goal_hours   ?? 3;
      return { label: DAY_SHORT[i], longLabel: DAY_LABELS[i], studied, planned, isToday, isFuture };
    }
    return { label: DAY_SHORT[i], longLabel: DAY_LABELS[i], studied: 0, planned: 3, isToday, isFuture: isFuture || analyticsLoading };
  });

  // Find peak study day (excluding future + today if 0)
  const peakBar = dailyBars.reduce(
    (best, d, i) => (!d.isFuture && d.studied > 0 && d.studied > (best?.studied ?? 0) ? { ...d, i } : best),
    null
  );

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerIconWrap}>
          <TrendingUp className={styles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
        </div>
        <span className={styles.headerLabel}>This Week</span>
      </div>

      {/* Ring + stats side-by-side */}
      <div className={styles.heroRow}>
        <div className={styles.ringWrapper} aria-label={`${pct}% of weekly goal completed`} role="img">
          <svg width={RING_SIZE} height={RING_SIZE} className={styles.ring}>
            <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} className={styles.ringTrack} strokeWidth={STROKE_WIDTH} />
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

        <div className={styles.heroStats}>
          <div className={styles.heroStatRow}>
            <span className={styles.heroStatNum}>{hoursStudied}h</span>
            <span className={styles.heroStatLabel}>studied</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStatRow}>
            <span className={styles.heroStatNumMuted}>{hoursGoal}h</span>
            <span className={styles.heroStatLabel}>planned</span>
          </div>
          {streak > 0 && (
            <motion.div
              className={styles.streakChip}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <Flame size={11} strokeWidth={2} aria-hidden />
              {streak}d streak
            </motion.div>
          )}
        </div>
      </div>

      {/* Insight line */}
      <div className={styles.insightRow}>
        <insight.icon size={12} strokeWidth={2} style={{ color: insight.color, flexShrink: 0 }} aria-hidden />
        <span className={styles.insightText} style={{ color: insight.color }}>{insight.text}</span>
      </div>

      {/* Daily breakdown */}
      <div className={styles.dailyBreakdown}>
        <div className={styles.dailyHeaderRow}>
          <span className={styles.dailyLabel}>Daily breakdown</span>
          {peakBar && (
            <span className={styles.peakHint}>
              Peak: {peakBar.longLabel} ({peakBar.studied}h)
            </span>
          )}
        </div>
        <div className={styles.dailyBars}>
          {dailyBars.map((d, i) => {
            const barPct = d.planned > 0 ? Math.min(1, d.studied / d.planned) : 0;
            const barColor = getDailyBarColor(barPct, d.isToday);
            return (
              <div key={i} className={`${styles.dailyRow} ${d.isToday ? styles.dailyRowToday : ""}`}>
                <span className={styles.dailyDay}>{d.label}</span>
                <div className={styles.dailyBarTrack}>
                  {!d.isFuture && barColor && (
                    <motion.div
                      className={styles.dailyBarFill}
                      style={{ width: `${barPct * 100}%`, background: barColor }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.5 + i * 0.06 }}
                    />
                  )}
                </div>
                <span className={`${styles.dailyHours} ${d.isToday ? styles.dailyHoursToday : ""}`}>
                  {d.isFuture ? "" : d.studied > 0 ? `${d.studied}h` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <Link to="/analytics" className={styles.footerLink}>
          View full analytics
          <ArrowRight size={11} strokeWidth={2} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
