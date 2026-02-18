import styles from './SummaryCards.module.css';

const ProductivityCard = ({ icon, label, value, unit, color, subtitle }) => (
  <div className={styles.card} style={{ borderLeftColor: color }}>
    <div className={styles.icon}>{icon}</div>
    <div className={styles.content}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        {value ?? '—'}
        {value != null && unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  </div>
);

const ProductivityCards = ({ summary, progressSummary }) => {
  const ratio = summary.work_break_ratio;
  const adherence = progressSummary?.adherence_percentage;

  return (
    <div className={styles.summaryGrid}>
      <ProductivityCard
        icon="⚖️"
        label="Work / Break Ratio"
        value={ratio ? `${ratio}:1` : null}
        color="#2196F3"
        subtitle="Minutes of work per minute of break"
      />
      <ProductivityCard
        icon="🚀"
        label="Overtime Sessions"
        value={summary.overtime_sessions}
        color="#F44336"
        subtitle="Sessions that ran past planned time"
      />
      <ProductivityCard
        icon="🎯"
        label="Schedule Adherence"
        value={adherence}
        unit="%"
        color="#9C27B0"
        subtitle="Actual vs planned study time"
      />
      <ProductivityCard
        icon="📅"
        label="Planned Hours"
        value={progressSummary?.total_planned_hours}
        unit="hrs"
        color="#FF9800"
        subtitle="From your calendar events"
      />
    </div>
  );
};

export default ProductivityCards;
