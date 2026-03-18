import { motion } from 'framer-motion';
import styles from './InsightCards.module.css';

const getColor = (s) => s >= 80 ? '#4CAF50' : s >= 60 ? '#8BC34A' : s >= 40 ? '#FF9800' : '#F44336';
const getLabel = (s) => s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Building' : 'Getting Started';

const getExplanation = (days, total, streak, score) => {
  const pct = Math.round((days / total) * 100);
  const base = `Studied ${days} of ${total} days (${pct}%)`;
  if (score >= 80) return `${base} with a ${streak}-day streak — outstanding habit.`;
  if (score >= 60) return `${base}. Strong consistency, keep the streak alive.`;
  if (score >= 40) return `${base}. Good start — aim for fewer gaps.`;
  return `${base} so far. Log sessions daily to build your score.`;
};

const calcScore = (totalDays, maxDays, streak) => {
  const coverage = totalDays / maxDays;
  const streakBonus = Math.min(streak / maxDays, 1);
  return Math.min(100, Math.round(coverage * 70 + streakBonus * 30));
};

const RING_TRANSITION = { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 };
const NUM_TRANSITION = { delay: 0.5 };

function ScoreRing({ score, color }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  return (
    <div className={styles.scoreRing}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
        <motion.circle
          cx="48" cy="48" r={radius} fill="none" stroke={color}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={RING_TRANSITION}
          transform="rotate(-90 48 48)"
        />
      </svg>
      <div className={styles.scoreCenter}>
        <motion.span className={styles.scoreNum} style={{ color }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={NUM_TRANSITION}>
          {score}
        </motion.span>
        <span className={styles.scoreMax}>/100</span>
      </div>
    </div>
  );
}

export function ConsistencyScore({ data }) {
  if (!data?.summary) return null;
  const { summary } = data;
  const streak = summary.current_streak_days || 0;
  const totalDays = summary.active_days ?? (data.daily_breakdown?.filter(d => d.sessions > 0).length || 0);
  const maxDays = Math.max(data.period_days || 30, 1);
  const score = calcScore(totalDays, maxDays, streak);
  const color = getColor(score);
  return (
    <div className={styles.scoreCard}>
      <p className={styles.cardLabel} title="Score = % of days studied (70%) + streak bonus (30%). Max 100.">Consistency</p>
      <ScoreRing score={score} color={color} />
      <span className={styles.scoreLabel} style={{ color }}>{getLabel(score)}</span>
      <p className={styles.scoreExplain}>{getExplanation(totalDays, maxDays, streak, score)}</p>
    </div>
  );
}
