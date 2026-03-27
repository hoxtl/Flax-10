/*
 * Peak hours insight card.
 */

import { motion } from 'framer-motion';
import styles from '../styles/InsightCards.module.css';
import EmptyState from '../../common/empty_state/EmptyState';

const MotionDiv = motion.div;

const sumColumn = (grid, hi) => grid.reduce((sum, row) => sum + (row[hi] || 0), 0);
const computeHourTotals = (grid, hours) => hours.map((_, hi) => sumColumn(grid, hi));

const getTopHours = (hourTotals, hours) => hourTotals
  .map((v, i) => ({ h: hours[i], v }))
  .sort((a, b) => b.v - a.v)
  .slice(0, 3)
  .filter(x => x.v > 0);

const fmt = (h) => {
  const num = parseInt(h);
  return `${num % 12 || 12}${num >= 12 ? 'pm' : 'am'}`;
};

const BAR_TRANSITION = (rank) => ({ duration: 0.8, delay: rank * 0.1, ease: [0.22, 1, 0.36, 1] });
const PEAK_HOURS_TOOLTIP = 'Hours when you study most. Schedule demanding tasks here.';

function PeakItem({ hour, value, max, rank }) {
  return (
    <div className={styles.peakItem}>
      <div className={styles.peakRank}>#{rank}</div>
      <div className={styles.peakInfo}>
        <span className={styles.peakTime}>{fmt(hour)}</span>
        <div className={styles.peakBar}>
          <MotionDiv
            className={styles.peakFill}
            initial={{ width: 0 }}
            animate={{ width: `${(value / max) * 100}%` }}
            transition={BAR_TRANSITION(rank - 1)}
            style={{ opacity: 1 - (rank - 1) * 0.2 }}
          />
        </div>
      </div>
    </div>
  );
}

function NoPeakData() {
  return (
    <div className={styles.noDataWrap}>
      <EmptyState
        icon="📈"
        title="No peak-hour data yet"
        description="Study sessions will appear here once you log more time."
      />
    </div>
  );
}

function PeakList({ topHours, max }) {
  return (
    <div className={styles.peakList}>
      {topHours.map(({ h, v }, i) => (
        <PeakItem key={`peak-${i}`} hour={h} value={v} max={max} rank={i + 1} />
      ))}
    </div>
  );
}

export function PeakHoursCard({ data }) {
  if (!data?.heatmap) return null;
  const { data: grid, hours } = data.heatmap;
  if (!Array.isArray(grid) || !Array.isArray(hours)) return null;
  const hourTotals = computeHourTotals(grid, hours);
  const max = Math.max(...hourTotals, 1);
  const topHours = getTopHours(hourTotals, hours);
  return (
    <div className={styles.peakCard} data-tooltip={topHours.length > 0 ? PEAK_HOURS_TOOLTIP : undefined}>
      <p className={styles.cardLabel}>Peak Hours</p>
      {topHours.length === 0 ? <NoPeakData /> : <PeakList topHours={topHours} max={max} />}
    </div>
  );
}
