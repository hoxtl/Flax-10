import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Flame, Clock, ArrowRight, CalendarClock, Zap, CheckCircle2, BarChart3 } from "lucide-react";
import { useProfileSummary } from "../../Profile/hooks/useProfileSummary";
import analyticsService from "../../../api/analyticsService";
import styles from "./StudyPulseWidget.module.css";

/* ─── Ring constants ───────────────────────────── */
const RING_SIZE = 56;
const STROKE_W  = 5;
const RADIUS    = (RING_SIZE - STROKE_W - 3) / 2; // Added 3px buffer to prevent edge clipping
const CIRC      = 2 * Math.PI * RADIUS;

const MOCK = { pct: 48, studied: 9.6, goal: 20, streak: 4 };
const DAY_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

function getRingColor(pct) {
  if (pct <= 30) return "var(--home-urgency-danger)";
  if (pct <= 70) return "var(--color-primary)";
  return "var(--sage)";
}

function getDailyBarColor(pct, isToday) {
  if (isToday) return "var(--color-primary-solid)";
  if (pct >= 0.8) return "var(--sage)";
  if (pct >= 0.4) return "var(--color-primary)";
  return "color-mix(in srgb, var(--color-primary) 35%, transparent)";
}

function getTodayIdx() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function fmt24(date) {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function fmtDur(mins) {
  const m = Math.round(mins);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

/** Find the hour with most total study minutes across the heatmap */
function getPeakHour(heatmap) {
  if (!heatmap?.data || !heatmap.data.length) return null;
  const hourTotals = Array(24).fill(0);
  heatmap.data.forEach((dayRow) => {
    if (!Array.isArray(dayRow)) return;
    dayRow.forEach((mins, hr) => { hourTotals[hr] += (mins || 0); });
  });
  const maxMins = Math.max(...hourTotals);
  if (maxMins === 0) return null;
  return hourTotals.indexOf(maxMins);
}

function fmtPeakRange(hr) {
  const fmt = (h) => {
    const ampm = h < 12 ? "am" : "pm";
    return `${h % 12 || 12}${ampm}`;
  };
  return `${fmt(hr)}–${fmt(hr + 1)}`;
}

/** Build prioritised list of insight rows from available data */
function buildInsights({ streak, todayStudied, weeklyRemaining, daysLeft, peakHour, deadlines, pct, currentHour }) {
  const list = [];

  // 1. Streak at risk — highest urgency
  if (streak > 0 && todayStudied === 0 && currentHour >= 14) {
    list.push({
      type: "warning",
      Icon: Flame,
      text: `${streak}-day streak at risk — no session yet`,
    });
  }

  // 2. Urgent deadline (≤5 days) — flag if study goal is below 70%
  const urgent = (deadlines || [])
    .filter((d) => d.start_due_date)
    .map((d) => ({
      ...d,
      daysLeft: Math.floor((new Date(d.start_due_date) - Date.now()) / 86400000),
    }))
    .filter((d) => d.daysLeft >= 0 && d.daysLeft <= 5)
    .sort((a, b) => a.daysLeft - b.daysLeft)[0];

  if (urgent && pct < 70) {
    const label = urgent.assessment_title || urgent.title || "Deadline";
    const code  = urgent.module_code ? ` · ${urgent.module_code}` : "";
    const short = label.length > 22 ? label.slice(0, 22) + "…" : label;
    list.push({
      type: "alert",
      Icon: CalendarClock,
      text: `${short} due in ${urgent.daysLeft === 0 ? "today" : `${urgent.daysLeft}d`}${code}`,
    });
  }

  // 3. Today's study budget
  const dailyBudget = daysLeft > 0 ? weeklyRemaining / daysLeft : 0;
  const budgetLeft  = Math.max(0, dailyBudget - todayStudied);
  if (budgetLeft > 0.1) {
    list.push({
      type: "info",
      Icon: Clock,
      text: `${budgetLeft.toFixed(1)}h more today keeps you on track`,
    });
  } else if (dailyBudget > 0 && todayStudied >= dailyBudget) {
    list.push({
      type: "success",
      Icon: CheckCircle2,
      text: "Today's target met — great work",
    });
  }

  // 4. Peak hours (always if data available, max 3 insights total)
  if (peakHour !== null && list.length < 4) {
    const isNow = currentHour === peakHour || currentHour === peakHour - 1;
    list.push({
      type: isNow ? "accent" : "neutral",
      Icon: Zap,
      text: isNow
        ? `Peak focus window — happening now!`
        : `Your peak focus: ${fmtPeakRange(peakHour)}`,
    });
  }

  return list.slice(0, 3); // max 3 insights
}

const INSIGHT_STYLES = {
  warning: { color: "var(--home-urgency-warning)", bg: "color-mix(in srgb, var(--home-urgency-warning) 12%, transparent)" },
  alert:   { color: "var(--home-urgency-danger)", bg: "color-mix(in srgb, var(--home-urgency-danger) 12%, transparent)" },
  info:    { color: "var(--color-primary)", bg: "color-mix(in srgb, var(--color-primary) 8%, transparent)" },
  success: { color: "var(--sage)", bg: "var(--success-bg)" },
  accent:  { color: "var(--color-highlight)", bg: "color-mix(in srgb, var(--color-highlight) 12%, transparent)" },
  neutral: { color: "var(--text-secondary)", bg: "transparent" },
};

export function StudyPulseWidget({ windows = [], now = new Date(), onStartFocus, deadlines = [] }) {
  const navigate  = useNavigate();
  const { summary, loading: profileLoading } = useProfileSummary();
  const [analyticsData, setAnalyticsData] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    analyticsService
      .getSummary(7)
      .then(setAnalyticsData)
      .catch(() => {});
  }, []);

  /* ─── Weekly data ─────────────────────────────── */
  const weekly  = !profileLoading ? summary?.weekly  : null;
  const streaks = !profileLoading ? summary?.streaks : null;
  const pct     = weekly ? Math.min(100, Math.max(0, Math.round(weekly.percentage ?? 0))) : MOCK.pct;
  const studied = weekly ? (weekly.hours_studied ?? MOCK.studied) : MOCK.studied;
  const goal    = weekly ? (weekly.goal_hours    ?? MOCK.goal)    : MOCK.goal;
  const streak  = streaks ? (streaks.current     ?? MOCK.streak)  : MOCK.streak;

  const ringColor  = getRingColor(pct);
  const dashOffset = CIRC * (1 - pct / 100);
  const todayIdx   = getTodayIdx();

  /* ─── Daily bars ──────────────────────────────── */
  const rawDays = analyticsData?.daily_breakdown;
  const dailyBars = Array.from({ length: 7 }, (_, i) => {
    const isToday  = i === todayIdx;
    const isFuture = i > todayIdx;
    if (rawDays?.[i]) {
      const d = rawDays[i];
      const s = d.hours_studied ?? d.actual_hours ?? 0;
      const p = d.planned_hours ?? d.goal_hours   ?? 3;
      return { label: DAY_SHORT[i], studied: s, planned: p, isToday, isFuture };
    }
    return { label: DAY_SHORT[i], studied: 0, planned: 3, isToday, isFuture };
  });

  /* ─── Insights ────────────────────────────────── */
  const peakHour       = getPeakHour(analyticsData?.heatmap);
  const todayBar       = dailyBars[todayIdx];
  const weeklyRemain   = Math.max(0, goal - studied);
  const today          = now.getDay();
  const daysLeft       = Math.max(1, 7 - (today === 0 ? 7 : today));
  const currentHour    = now.getHours();

  const insights = buildInsights({
    streak,
    todayStudied: todayBar.studied,
    weeklyRemaining: weeklyRemain,
    daysLeft,
    peakHour,
    deadlines,
    pct,
    currentHour,
  });

  /* ─── Focus window data ───────────────────────── */
  const nowMs = now.getTime();
  const futureWindows = [...windows]
    .filter((w) => w.end.getTime() > nowMs)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const nextWindow = futureWindows[0] ?? null;
  const analyticsHref = "/analytics?period=7&tab=Overview&from=study-pulse";

  const handleViewAnalytics = () => navigate(analyticsHref);

  return (
    <div className={styles.root}>
      {/* ─── Header ───────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconWrap}>
            <TrendingUp size={17} strokeWidth={1.75} className={styles.headerIcon} aria-hidden />
          </div>
          <div className={styles.headerTitleGroup}>
            <span className={styles.headerTitle}>Study Pulse</span>
            <span className={styles.headerSource}>
              <BarChart3 size={11} strokeWidth={1.8} aria-hidden />
              7-day analytics snapshot
            </span>
          </div>
        </div>
        <Link to={analyticsHref} className={styles.headerLink}>
          View analytics
          <ArrowRight size={11} strokeWidth={2} aria-hidden />
        </Link>
      </div>

      {/* ─── Body: left + right columns ───────────── */}
      <div className={styles.body}>
        {/* LEFT: weekly progress */}
        <div className={styles.leftCol}>
          <div className={styles.ringRow}>
            <div className={styles.ringWrap} aria-label={`${pct}% of weekly goal`} role="img">
              <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className={styles.ring}>
                <circle cx={RING_SIZE/2} cy={RING_SIZE/2} r={RADIUS} className={styles.ringTrack} strokeWidth={STROKE_W} />
                <motion.circle
                  cx={RING_SIZE/2} cy={RING_SIZE/2} r={RADIUS}
                  className={styles.ringFill}
                  strokeWidth={STROKE_W}
                  stroke={ringColor}
                  strokeDasharray={CIRC}
                  initial={{ strokeDashoffset: CIRC }}
                  animate={{ strokeDashoffset: dashOffset }}
                  transition={{ duration: 1.1, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                />
              </svg>
              <div className={styles.ringCenter}>
                <span className={styles.ringPct}>{pct}%</span>
              </div>
            </div>
            <div className={styles.ringMeta}>
              <span className={styles.ringHours}>{studied}h of {goal}h</span>
              {streak > 0 && (
                <motion.span
                  className={styles.streakChip}
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 0.5, delay: 1.0 }}
                >
                  <Flame size={10} strokeWidth={2} aria-hidden />
                  {streak}-day streak
                </motion.span>
              )}
            </div>
          </div>

          {/* Daily bars */}
          <div className={styles.dailyBars}>
            {dailyBars.map((d, i) => {
              const barPct   = d.planned > 0 ? Math.min(1, d.studied / d.planned) : 0;
              const barColor = getDailyBarColor(barPct, d.isToday);
              return (
                <div key={i} className={styles.dailyRow}>
                  <span className={`${styles.dailyDay} ${d.isToday ? styles.dailyDayToday : ""}`}>
                    {d.label}
                  </span>
                  <div className={styles.dailyTrack}>
                    {!d.isFuture && barColor && (
                      <motion.div
                        className={styles.dailyFill}
                        style={{ width: `${barPct * 100}%`, background: barColor }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1], delay: 0.4 + i * 0.05 }}
                      />
                    )}
                    {!d.isFuture && !barColor && d.isToday && (
                      <div className={styles.dailyFill} style={{ width: "3px", background: "#2c1810", borderRadius: "2px" }} />
                    )}
                  </div>
                  <span className={`${styles.dailyHours} ${d.isToday ? styles.dailyHoursToday : ""}`}>
                    {d.isFuture ? "" : d.studied > 0 ? `${d.studied}h` : d.isToday ? "—" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* RIGHT: insights + focus window */}
        <div className={styles.rightCol}>
          {/* Dynamic insight rows */}
          {insights.length > 0 && (
            <div className={styles.insightList}>
              {insights.map((ins, i) => {
                const s = INSIGHT_STYLES[ins.type] || INSIGHT_STYLES.neutral;
                return (
                  <motion.div
                    key={i}
                    className={styles.insightRow}
                    style={{ background: s.bg }}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <ins.Icon size={12} strokeWidth={2} className={styles.insightIcon} style={{ color: s.color }} aria-hidden />
                    <span className={styles.insightText} style={{ color: s.color }}>{ins.text}</span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Next focus window */}
          {nextWindow ? (
            <div className={styles.windowBlock}>
              <p className={styles.windowLabel}>Next focus window</p>
              <div className={styles.windowTimeRow}>
                <span className={styles.windowTime}>
                  {fmt24(nextWindow.start)} – {fmt24(nextWindow.end)}
                </span>
                <span className={styles.windowDurPill}>{fmtDur(nextWindow.minutes)}</span>
              </div>
            </div>
          ) : (
            <div className={styles.windowBlock}>
              <p className={styles.windowLabel}>Focus windows</p>
              <p className={styles.windowEmpty}>No free windows left today</p>
            </div>
          )}

          {/* CTA */}
          <button type="button" className={styles.startBtn} onClick={handleViewAnalytics}>
            Open 7-day analytics →
          </button>
        </div>
      </div>
    </div>
  );
}
