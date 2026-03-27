/**
 * Reusable location summary chip.
 */

import styles from '../../pages/campus_map/sidebar.module.css';

export function LocationChip({ dotColor, title, subtitle, onClear }) {
  return (
    <div className={styles.locationChip}>
      <div className={styles.locationChipDot} style={{ background: dotColor }} />
      <div className={styles.locationChipText}>
        <span className={styles.locationCoords}>{title}</span>
        <span className={styles.locationHint}>{subtitle}</span>
      </div>
      <button className={styles.clearBtn} onClick={onClear} title="Clear">✕</button>
    </div>
  );
}
