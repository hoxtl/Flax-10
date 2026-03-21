/*
 * Productivity analytics cards.
 */

<<<<<<< HEAD
import styles from "./SummaryCards.module.css";

import ProductivityCard from "./ProductivityCard";
import { buildCardsConfig } from "./productivityCardData";

export default function ProductivityCards({ balanced = false, data, progressData }) {
  if (!data?.summary) return null;
  const cards = buildCardsConfig(data.summary, progressData?.summary);
  return <div className={`${styles.grid} ${styles.productivityGrid} ${balanced ? styles.productivityGridBalanced : ""}`.trim()}>{cards.map((card) => <ProductivityCard key={card.label} {...card} />)}</div>;
}
=======
const buildCardsConfig = (summary, progressSummary) => [
  { icon: '⚖️', label: 'Work / Break Ratio', value: summary.work_break_ratio ? `${summary.work_break_ratio}:1` : null, color: '#2196F3', subtitle: 'Work per break minute' },
  { icon: '🚀', label: 'Overtime Sessions', value: summary.overtime_sessions, color: '#F44336', subtitle: 'Ran past planned time' },
  { icon: '🎯', label: 'Schedule Adherence', value: progressSummary?.adherence_percentage, unit: '%', color: '#9C27B0', subtitle: 'Actual vs planned' },
  { icon: '📅', label: 'Planned Hours', value: progressSummary?.total_planned_hours, unit: 'hrs', color: '#FF9800', subtitle: 'From your calendar' },
];

const ProductivityCard = ({ icon, label, value, unit, color, subtitle }) => (
  <div className={styles.card} style={{ borderLeftColor: color }}>
    <div className={styles.iconWrap} style={{ background: color + '18', color }}>
      <span className={styles.icon}>{icon}</span>
    </div>
    <div className={styles.content}>
      <p className={styles.label}>{label}</p>
      <div className={styles.valueRow}>
        <span className={styles.value}>{value ?? '—'}</span>
        {value != null && unit && <span className={styles.unit}>{unit}</span>}
      </div>
      {subtitle && <p className={styles.label} style={{ marginTop: '0.15rem' }}>{subtitle}</p>}
    </div>
  </div>
);

const ProductivityCards = ({ data, progressData }) => {
  if (!data?.summary) return null;
  const cards = buildCardsConfig(data.summary, progressData?.summary);
  return (
    <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {cards.map(c => <ProductivityCard key={c.label} {...c} />)}
    </div>
  );
};

export default ProductivityCards;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
