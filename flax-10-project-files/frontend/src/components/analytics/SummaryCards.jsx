/*
 * Analytics summary cards.
 */

import { motion } from 'framer-motion';
import { useCountUp } from './hooks/useCountUp';
import styles from './SummaryCards.module.css';

const MotionDiv = motion.div;

const CARD_TRANSITION = (delay) => ({ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] });

const buildCardsConfig = (summary, activeDays) => [
  { icon: '⏱', label: 'Total Study Hours', value: summary.total_study_hours, unit: 'hrs', color: 'var(--color-caramel)', delay: 0, tooltip: 'Total focused study time recorded across all sessions' },
  { icon: '🎯', label: 'Sessions', value: summary.total_sessions, unit: null, color: 'var(--chart-accent-indigo)', delay: 0.03, tooltip: 'Number of study sessions completed in this period' },
  { icon: '📏', label: 'Avg Session', value: summary.avg_session_minutes, unit: 'min', color: 'var(--chart-accent-teal)', delay: 0.06, tooltip: 'Average duration of a single study session' },
  { icon: '🔥', label: 'Current Streak', value: summary.current_streak_days, unit: 'days', color: 'var(--chart-accent-orange)', delay: 0.09, tooltip: 'Consecutive days with at least one study session' },
  { icon: '🏆', label: 'Longest Session', value: summary.longest_session_minutes, unit: 'min', color: 'var(--chart-accent-deep-purple)', delay: 0.12, tooltip: 'Your longest single study session ever recorded' },
  { icon: '📅', label: 'Active Days', value: activeDays, unit: null, color: 'var(--chart-accent-green)', delay: 0.15, tooltip: 'Days in this period where you studied at least once' },
];

function CardIcon({ color, icon }) {
  return (
    <div className={styles.iconWrapColored} style={{ '--icon-color': color }}>
      <span className={styles.icon}>{icon}</span>
    </div>
  );
}

function CardValue({ countRef, unit }) {
  return (
    <div className={styles.valueRow}>
      <span className={styles.value} ref={countRef}>0</span>
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
  );
}

function StatCard({ icon, label, value, unit, color, delay, tooltip }) {
  const countRef = useCountUp(parseFloat(value) || 0);
  return (
    <MotionDiv
      className={styles.card}
      data-tooltip={tooltip}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={CARD_TRANSITION(delay)}
    >
      <CardIcon color={color} icon={icon} />
      <div className={styles.content}>
        <p className={styles.label}>{label}</p>
        <CardValue countRef={countRef} unit={unit} />
      </div>
    </MotionDiv>
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
