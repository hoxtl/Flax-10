import { motion } from 'framer-motion';
import { useCountUp } from './hooks/useCountUp';
import styles from './SummaryCards.module.css';

const CARD_TRANSITION = (delay) => ({ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] });

const buildCardsConfig = (summary, activeDays) => [
  { icon: '⏱', label: 'Total Study Hours', value: summary.total_study_hours, unit: 'hrs', color: '#9E7E5D', delay: 0, tooltip: 'Total focused study time recorded across all sessions' },
  { icon: '🎯', label: 'Sessions', value: summary.total_sessions, unit: null, color: '#5C6BC0', delay: 0.03, tooltip: 'Number of study sessions completed in this period' },
  { icon: '📏', label: 'Avg Session', value: summary.avg_session_minutes, unit: 'min', color: '#26A69A', delay: 0.06, tooltip: 'Average duration of a single study session' },
  { icon: '🔥', label: 'Current Streak', value: summary.current_streak_days, unit: 'days', color: '#EF6C00', delay: 0.09, tooltip: 'Consecutive days with at least one study session' },
  { icon: '🏆', label: 'Longest Session', value: summary.longest_session_minutes, unit: 'min', color: '#7B1FA2', delay: 0.12, tooltip: 'Your longest single study session ever recorded' },
  { icon: '📅', label: 'Active Days', value: activeDays, unit: null, color: '#388E3C', delay: 0.15, tooltip: 'Days in this period where you studied at least once' },
];

function StatCard({ icon, label, value, unit, color, delay, tooltip }) {
  const countRef = useCountUp(parseFloat(value) || 0);
  return (
    <motion.div
      className={styles.card}
      data-tooltip={tooltip || undefined}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CARD_TRANSITION(delay)}
    >
      <div className={styles.iconWrap} style={{ background: color + '18', color }}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <div className={styles.valueRow}>
          <span className={styles.value} ref={countRef}>0</span>
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export default function SummaryCards({ data }) {
  if (!data?.summary) return null;
  const { summary } = data;
  const activeDays = summary.active_days ?? (data.daily_breakdown?.filter(d => d.sessions > 0).length || 0);
  return (
    <div className={styles.grid}>
      {buildCardsConfig(summary, activeDays).map(c => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
