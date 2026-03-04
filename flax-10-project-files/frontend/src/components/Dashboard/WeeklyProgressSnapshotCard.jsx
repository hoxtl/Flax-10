/**
 * Weekly Progress Snapshot — Dashboard wrapper for Analytics integration.
 * Uses analyticsService and replicates a simplified Planned vs Actual view
 * without modifying any files in pages/Analytics or components/Analytics.
 * Imports the Analytics bar chart for "Your Week in Seeds" with Sage theme applied via CSS wrapper.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import analyticsService from "../../api/analyticsService";
import styles from "./WeeklyProgressSnapshotCard.module.css";

const SAGE_ACTUAL = "#52796f";
const SAGE_LIGHT = "rgba(82, 121, 111, 0.25)";
const CHART_HEIGHT = 280;
const DAYS = 7;
const WEEKLY_GOAL_HOURS = 20;
const DAILY_GOAL_SEEDS = 3;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_LABELS_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const GROWTH_CATEGORIES_LEGEND = [
  { key: "academic", label: "Academic", icon: "🎓", colorClass: "sage" },
  { key: "personal", label: "Personal", icon: "✨", colorClass: "flax" },
];

/** Expected hours by today if pacing evenly through the week (Monday–Sunday). */
function getExpectedHoursByToday() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 Sun .. 6 Sat
  const daysElapsed = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0 .. Sun=6, so "days into week" 0..6
  const daysIntoWeek = daysElapsed + 1; // 1..7
  return (WEEKLY_GOAL_HOURS * daysIntoWeek) / 7;
}

function useWeeklyProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    analyticsService
      .getProgress(DAYS)
      .then((res) => {
        const daily = res?.daily_progress ?? [];
        setData(Array.isArray(daily) ? daily.slice(-DAYS) : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);
  return { data, loading };
}

function useLatestAiSummary() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    analyticsService
      .getAiInsights(DAYS)
      .then((res) => {
        const raw = res?.insights;
        if (typeof raw !== "string" || !raw.trim()) return;
        const firstLine = raw.split("\n").find((l) => l.trim().length > 0);
        const text = (firstLine || raw).trim().slice(0, 120);
        setSummary(text);
      })
      .catch(() => {});
  }, []);
  return summary;
}

function MiniChart({ data }) {
  if (!data?.length) return null;
  const max = Math.max(
    0.5,
    ...data.map((d) => Math.max(parseFloat(d.planned_hours) || 0, parseFloat(d.actual_hours) || 0))
  );
  const labels = data.map((d) =>
    new Date(d.date).toLocaleDateString("en-GB", { weekday: "short" })
  );

  return (
    <div className={styles.chartWrap} role="img" aria-label="Weekly planned vs actual hours">
      <div className={styles.chartBars}>
        {data.map((d, i) => {
          const planned = Math.min(1, (parseFloat(d.planned_hours) || 0) / max);
          const actual = Math.min(1, (parseFloat(d.actual_hours) || 0) / max);
          return (
            <div key={d.date || i} className={styles.barGroup}>
              <div className={styles.barPair}>
                <div
                  className={styles.barPlanned}
                  style={{
                    height: `${planned * CHART_HEIGHT}px`,
                    backgroundColor: SAGE_LIGHT,
                  }}
                />
                <div
                  className={styles.barActual}
                  style={{
                    height: `${actual * CHART_HEIGHT}px`,
                    backgroundColor: SAGE_ACTUAL,
                  }}
                />
              </div>
              <span className={styles.barLabel}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Earthy gradient bars: Deep Sage (base) → Warm Flax Gold (top). Daily goal line, gold glow when bar meets goal. */
function WeeklyBarChart({ seedsPerDayThisWeek, dailyGoalSeeds = DAILY_GOAL_SEEDS }) {
  if (!seedsPerDayThisWeek || seedsPerDayThisWeek.length !== 7) return null;
  const max = Math.max(dailyGoalSeeds, ...seedsPerDayThisWeek, 1);
  const goalPercent = (dailyGoalSeeds / max) * 100;

  return (
    <div className={styles.weeklyChartInner}>
      <div
        className={styles.weeklyGoalLine}
        style={{ bottom: `${goalPercent}%` }}
        title={`Daily Goal: ${dailyGoalSeeds} Seeds`}
        aria-hidden
      />
      <span className={styles.weeklyGoalLabel} style={{ bottom: `calc(${goalPercent}% + 2px)` }}>
        Daily Goal: {dailyGoalSeeds} Seeds
      </span>
      <div className={styles.weeklyBars}>
        {seedsPerDayThisWeek.map((count, i) => {
          const heightPercent = max > 0 ? Math.max(4, (count / max) * 100) : 4;
          const meetsGoal = count >= dailyGoalSeeds && dailyGoalSeeds > 0;
          return (
            <div key={i} className={styles.weeklyBarGroup}>
              <div
                className={`${styles.weeklyBar} ${meetsGoal ? styles.weeklyBarGlow : ""}`}
                style={{ height: `${heightPercent}%` }}
                title={`${WEEKDAY_LABELS[i]}: ${count} seed${count !== 1 ? "s" : ""}${meetsGoal ? " ✓" : ""}`}
                role="img"
                aria-label={`${WEEKDAY_LABELS[i]}: ${count} seeds`}
              />
              <span className={styles.weeklyBarLabel}>{WEEKDAY_LABELS_SHORT[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GrowthByCategory({ categoryBreakdown }) {
  const breakdown = categoryBreakdown ?? { academic: 0, personal: 0 };
  return (
    <div className={styles.growthByCategory}>
      <span className={styles.growthByCategoryTitle}>Growth by Category</span>
      <ul className={styles.growthByCategoryList} aria-label="Seeds by category">
        {GROWTH_CATEGORIES_LEGEND.map(({ key, label, icon, colorClass }) => (
          <li key={key} className={styles.growthByCategoryItem}>
            <span
              className={`${styles.growthByCategoryDot} ${styles[`growthDot${colorClass.charAt(0).toUpperCase() + colorClass.slice(1)}`]}`}
              aria-hidden
            />
            <span className={styles.growthByCategoryLabel}>{icon} {label}:</span>
            <span className={styles.growthByCategoryCount}>{breakdown[key] ?? 0} Seeds</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WeeklyFocusGoalBar({ data }) {
  const actualHours = (data || []).reduce(
    (sum, d) => sum + (parseFloat(d.actual_hours) || 0),
    0
  );
  const expectedByToday = getExpectedHoursByToday();
  const isBehindPace = actualHours < expectedByToday;
  const pct = Math.min(100, (actualHours / WEEKLY_GOAL_HOURS) * 100);

  return (
    <div className={styles.goalWrap}>
      <p className={styles.goalText}>
        Goal: {WEEKLY_GOAL_HOURS}h Focus • You&apos;re at <strong>{actualHours.toFixed(1)}h</strong>
      </p>
      <div className={styles.goalTrack}>
        <div
          className={isBehindPace ? styles.goalFillBehind : styles.goalFillOnPace}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function WeeklyProgressSnapshotCard({
  todaysTaskProgress,
  goalsOnlyProgress,
  categoryBreakdown,
  seedsPerDayThisWeek,
  totalSeedsGrown = 0,
  currentStreak = 0,
}) {
  const navigate = useNavigate();
  const { data, loading } = useWeeklyProgress();

  const goalsCrushed = goalsOnlyProgress?.crushed ?? todaysTaskProgress?.crushed ?? 0;
  const totalGoals = goalsOnlyProgress?.total ?? todaysTaskProgress?.total ?? 0;
  const percentComplete = totalGoals > 0 ? Math.round((goalsCrushed / totalGoals) * 100) : 0;
  const completedToday = goalsCrushed;

  const showSeedsBars = Array.isArray(seedsPerDayThisWeek) && seedsPerDayThisWeek.length === 7;
  const showOnlySeedsChart = showSeedsBars;
  const showOnlyMiniChart = !showSeedsBars && data?.length > 0;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Your Weekly Progress</h3>

      <div className={styles.todayStats}>
        <span className={styles.todayStat}>
          <strong>{percentComplete}%</strong> Complete
        </span>
        <span className={styles.todayStatSep}>·</span>
        <span className={styles.todayStat}>
          Goals Crushed: <strong>{completedToday}</strong>
        </span>
      </div>

      {loading && (
        <div className={styles.placeholder}>
          <span className={styles.placeholderText}>Loading your week…</span>
        </div>
      )}

      {!loading && (
        <>
          <WeeklyFocusGoalBar data={data} />
          <div className={styles.weeklyChartContainer}>
            <div className={styles.weeklyChartMain}>
              <div className={styles.weeklyLegendRow}>
                <GrowthByCategory categoryBreakdown={categoryBreakdown} />
              </div>
              {showOnlySeedsChart ? (
                <WeeklyBarChart seedsPerDayThisWeek={seedsPerDayThisWeek} dailyGoalSeeds={DAILY_GOAL_SEEDS} />
              ) : showOnlyMiniChart ? (
                <div className={styles.chartAndLegend}>
                  <MiniChart data={data} />
                </div>
              ) : (
                <div className={styles.placeholder}>
                  <span className={styles.placeholderText}>No progress data this week yet.</span>
                </div>
              )}
            </div>
            <div className={styles.weeklySidebar}>
              <div className={styles.insetCard}>
                <span className={styles.insetCardValue}>{totalSeedsGrown}</span>
                <span className={styles.insetCardLabel}>Total Seeds Grown</span>
              </div>
              <div className={styles.insetCard}>
                <span className={styles.insetCardValue}>{currentStreak}</span>
                <span className={styles.insetCardLabel}>Current Streak</span>
              </div>
            </div>
          </div>
          <div className={styles.weeklyFooter}>
            <button
              type="button"
              className={styles.link}
              onClick={() => navigate("/analytics")}
            >
              View full report & heatmap →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
