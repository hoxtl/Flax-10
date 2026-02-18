import styles from './SummaryCards.module.css';

function computeConsistencyScore(summary, progressSummary, periodDays) {
  const streakScore = Math.min((summary.current_streak_days / periodDays) * 100, 100);
  const frequencyScore = Math.min((summary.total_sessions / periodDays) * 100, 100);
  const adherenceScore = progressSummary?.adherence_percentage ?? 50;
  return Math.round(streakScore * 0.3 + frequencyScore * 0.4 + adherenceScore * 0.3);
}

function scoreLabel(score) {
  if (score >= 80) return { label: 'Excellent', color: '#4CAF50' };
  if (score >= 60) return { label: 'Good', color: '#8BC34A' };
  if (score >= 40) return { label: 'Building', color: '#FF9800' };
  return { label: 'Getting Started', color: '#F44336' };
}

export const ConsistencyScore = ({ summary, progressSummary, periodDays }) => {
  const score = computeConsistencyScore(summary, progressSummary, periodDays);
  const { label, color } = scoreLabel(score);
  return (
    <div className={styles.card} style={{ borderLeftColor: color }}>
      <div className={styles.icon}>🎯</div>
      <div className={styles.content}>
        <div className={styles.label}>Consistency Score</div>
        <div className={styles.value} style={{ color }}>{score}<span className={styles.unit}>/100</span></div>
        <div className={styles.subtitle}>{label} — based on streak, frequency &amp; adherence</div>
      </div>
    </div>
  );
};

function getPeakHours(heatmapData) {
  const hourTotals = Array(24).fill(0);
  for (const dayRow of heatmapData) {
    dayRow.forEach((val, h) => { hourTotals[h] += val; });
  }
  return hourTotals
    .map((total, h) => ({ hour: h, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3)
    .filter(x => x.total > 0)
    .map(x => {
      const suffix = x.hour < 12 ? 'am' : 'pm';
      const display = x.hour === 0 ? 12 : x.hour > 12 ? x.hour - 12 : x.hour;
      return `${display}${suffix}`;
    });
}

export const PeakHoursCard = ({ heatmapData }) => {
  const peaks = getPeakHours(heatmapData);
  return (
    <div className={styles.card} style={{ borderLeftColor: '#FF9800' }}>
      <div className={styles.icon}>⚡</div>
      <div className={styles.content}>
        <div className={styles.label}>Peak Study Hours</div>
        <div className={styles.value} style={{ fontSize: '1.25rem' }}>{peaks.length > 0 ? peaks.join(', ') : '—'}</div>
        <div className={styles.subtitle}>When you get the most work done</div>
      </div>
    </div>
  );
};
