import { motion } from 'framer-motion';
import styles from './InsightCards.module.css';
import EmptyState from '../common/EmptyState/EmptyState';

export function ConsistencyScore({ data }) {
  if (!data?.summary) return null;
  const { summary } = data;
  const streak = summary.current_streak_days || 0;
  const totalDays = summary.active_days ?? (data.daily_breakdown?.filter(d => d.sessions > 0).length || 0);
  const maxDays = Math.max(data.period_days || 30, 1);

  // Transparent formula: 70% = days studied / period, 30% = streak bonus
  const coverage = totalDays / maxDays;
  const streakBonus = Math.min(streak / maxDays, 1);
  const score = Math.min(100, Math.round(coverage * 70 + streakBonus * 30));

  const getColor = (s) => s >= 80 ? '#4CAF50' : s >= 60 ? '#8BC34A' : s >= 40 ? '#FF9800' : '#F44336';
  const getLabel = (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Building' : 'Getting Started';
  const getExplanation = (days, total, s) => {
    const pct = Math.round((days / total) * 100);
    const base = `Studied ${days} of ${total} days (${pct}%)`;
    if (s >= 80) return `${base} with a ${streak}-day streak — outstanding habit.`;
    if (s >= 60) return `${base}. Strong consistency, keep the streak alive.`;
    if (s >= 40) return `${base}. Good start — aim for fewer gaps.`;
    return `${base} so far. Log sessions daily to build your score.`;
  };

  const color = getColor(score);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className={styles.scoreCard}>
      <p className={styles.cardLabel} title="Score = % of days studied (70%) + streak bonus (30%). Max 100.">Consistency</p>
      <div className={styles.scoreRing}>
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r={radius} fill="none" stroke={color}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            transform="rotate(-90 48 48)"
          />
        </svg>
        <div className={styles.scoreCenter}>
          <motion.span
            className={styles.scoreNum}
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className={styles.scoreMax}>/100</span>
        </div>
      </div>
      <span className={styles.scoreLabel} style={{ color }}>{getLabel(score)}</span>
      <p className={styles.scoreExplain}>
        {getExplanation(totalDays, maxDays, score)}
      </p>
    </div>
  );
}

export function PeakHoursCard({ data }) {
  if (!data?.heatmap) return null;
  const { data: grid, hours } = data.heatmap;
  if (!Array.isArray(grid) || !Array.isArray(hours)) return null;

  const hourTotals = hours.map((_, hi) =>
    grid.reduce((sum, row) => sum + (row[hi] || 0), 0)
  );

  const max = Math.max(...hourTotals, 1);
  const topHours = hourTotals
    .map((v, i) => ({ h: hours[i], v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .filter(x => x.v > 0);

  const fmt = (h) => {
    const num = parseInt(h);
    return `${num % 12 || 12}${num >= 12 ? 'pm' : 'am'}`;
  };

  return (
    <div className={styles.peakCard}>
      <p className={styles.cardLabel}>Peak Hours</p>
      {topHours.length === 0 ? (
        <div className={styles.noDataWrap}>
          <EmptyState
            icon="📈"
            title="No peak-hour data yet"
            description="Study sessions will appear here once you log more time."
          />
        </div>
      ) : (
        <>
          <div className={styles.peakList}>
            {topHours.map(({ h, v }, i) => (
              <div key={`peak-${i}`} className={styles.peakItem}>
                <div className={styles.peakRank}>#{i + 1}</div>
                <div className={styles.peakInfo}>
                  <span className={styles.peakTime}>{fmt(h)}</span>
                  <div className={styles.peakBar}>
                    <motion.div
                      className={styles.peakFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${(v / max) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ opacity: 1 - i * 0.2 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className={styles.scoreExplain}>
            Hours when you study most. Schedule demanding tasks here.
          </p>
        </>
      )}
    </div>
  );
}
