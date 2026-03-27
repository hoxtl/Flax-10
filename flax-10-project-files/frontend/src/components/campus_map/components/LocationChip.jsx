/**
 * Reusable location summary chip.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/components/campus_map/components/LocationChip.jsx
import styles from '../../../pages/campus_map/styles/sidebar.module.css';
=======
import styles from '../../pages/campus_map/sidebar.module.css';
>>>>>>> main:flax-10-project-files/frontend/src/components/campus_map/LocationChip.jsx

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
