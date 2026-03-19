import styles from '../../pages/CampusMap/sidebar.module.css';
import { KCL_CAMPUSES } from '../../lib/kclCampuses';

export function CampusQuickNav({ onFly }) {
  return (
    <div className={styles.campusQuickNav}>
      {KCL_CAMPUSES.map((campus) => (
        <button
          key={campus.id}
          className={styles.quickNavBtn}
          onClick={() => onFly(campus)}
          title={campus.name}
        >
          <span className={styles.quickNavDot} style={{ background: campus.color }} />
          {campus.shortName}
        </button>
      ))}
    </div>
  );
}
