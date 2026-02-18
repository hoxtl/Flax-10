import styles from './SummaryCards.module.css';

const SummaryCard = ({ icon, label, value, unit, color }) => (
  <div className={styles.card} style={{ borderLeftColor: color }}>
    <div className={styles.icon}>{icon}</div>
    <div className={styles.content}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
    </div>
  </div>
);

const SummaryCards = ({ summary }) => {
  return (
    <div className={styles.summaryGrid}>
      <SummaryCard
        icon="📚"
        label="Total Study Hours"
        value={summary.total_study_hours}
        unit="hrs"
        color="#4CAF50"
      />
      <SummaryCard
        icon="🔥"
        label="Total Sessions"
        value={summary.total_sessions}
        color="#FF9800"
      />
      <SummaryCard
        icon="⏱️"
        label="Avg Session"
        value={summary.avg_session_minutes}
        unit="min"
        color="#2196F3"
      />
      <SummaryCard
        icon="🏆"
        label="Longest Session"
        value={summary.longest_session_minutes}
        unit="min"
        color="#9C27B0"
      />
      <SummaryCard
        icon="📅"
        label="Current Streak"
        value={summary.current_streak_days}
        unit="days"
        color="#F44336"
      />
      <SummaryCard
        icon="⚡"
        label="Best Streak"
        value={summary.longest_streak_days}
        unit="days"
        color="#FFC107"
      />
    </div>
  );
};

export default SummaryCards;
