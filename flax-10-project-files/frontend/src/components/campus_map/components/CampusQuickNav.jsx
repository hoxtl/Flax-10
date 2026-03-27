/**
 * Quick campus navigation controls.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/components/campus_map/components/CampusQuickNav.jsx
import styles from '../../../pages/campus_map/styles/sidebar.module.css';
import { KCL_CAMPUSES } from '../../../lib/kclCampuses';
=======
import styles from '../../pages/campus_map/sidebar.module.css';
import { KCL_CAMPUSES } from '../../lib/kclCampuses';
>>>>>>> main:flax-10-project-files/frontend/src/components/campus_map/CampusQuickNav.jsx

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
