/*
 * Consistency score insight card.
 */

import { motion } from 'framer-motion';
import Tooltip from '../../common/Tooltip/Tooltip';
import styles from '../styles/InsightCards.module.css';

const MotionCircle = motion.circle;
const MotionSpan = motion.span;

const getColor = (s) => s >= 80 ? 'var(--chart-study)' : s >= 60 ? 'var(--chart-study-light)' : s >= 40 ? 'var(--chart-break)' : 'var(--chart-accent-red)';
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
const SCORE_TITLE = 'Score = % of days studied (70%) + streak bonus (30%). Max 100.';

const getScoreGeometry = (score) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  return { circumference, dashOffset: circumference - (score / 100) * circumference, radius };
};

function ScoreTrack({ radius }) {
  return <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />;
}

function ScoreProgress({ color, circumference, dashOffset, radius }) {
  return (
    <MotionCircle
      cx="48" cy="48" r={radius} fill="none" stroke={color}
      strokeWidth="6" strokeLinecap="round"
      strokeDasharray={circumference}
      initial={{ strokeDashoffset: circumference }}
      animate={{ strokeDashoffset: dashOffset }}
      transition={RING_TRANSITION}
      transform="rotate(-90 48 48)"
    />
  );
}

function ScoreValue({ color, score }) {
  return (
    <MotionSpan className={styles.scoreNum} style={{ color }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={NUM_TRANSITION}>
      {score}
    </MotionSpan>
  );
}

function ScoreRing({ score, color }) {
  const { circumference, dashOffset, radius } = getScoreGeometry(score);
  return (
    <div className={styles.scoreRing}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <ScoreTrack radius={radius} />
        <ScoreProgress color={color} circumference={circumference} dashOffset={dashOffset} radius={radius} />
      </svg>
      <div className={styles.scoreCenter}>
        <ScoreValue color={color} score={score} />
        <span className={styles.scoreMax}>/100</span>
      </div>
    </div>
  );
}

function getConsistencyViewModel(data) {
  const streak = data.summary.current_streak_days || 0;
  const totalDays = data.summary.active_days ?? (data.daily_breakdown?.filter((day) => day.sessions > 0).length || 0);
  const maxDays = Math.max(data.period_days || 30, 1);
  const score = calcScore(totalDays, maxDays, streak);
  return { color: getColor(score), explanation: getExplanation(totalDays, maxDays, streak, score), label: getLabel(score), score };
}

function ScoreCard({ color, explanation, label, score }) {
  return (
    <div data-tooltip={explanation}>
      <Tooltip content={explanation} position="top">
        <div className={styles.scoreCard}>
          <Tooltip content={SCORE_TITLE} position="bottom">
            <p className={styles.cardLabel} title={SCORE_TITLE}>
              <span title={SCORE_TITLE}>Consistency</span>
              <span aria-hidden="true"> ⓘ</span>
            </p>
          </Tooltip>
          <ScoreRing score={score} color={color} />
          <span className={styles.scoreLabel} style={{ color }}>{label}</span>
        </div>
      </Tooltip>
    </div>
  );
}

export function ConsistencyScore({ data }) {
  if (!data?.summary) return null;
  return <ScoreCard {...getConsistencyViewModel(data)} />;
}
