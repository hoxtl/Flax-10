/**
 * Loading skeleton for the campus map page.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/components/campus_map/components/CampusMapSkeleton.jsx
import SkeletonBlock from '../../common/loading_state/SkeletonBlock';
import baseStyles from '../../../pages/campus_map/styles/CampusMap.module.css';
import sidebarStyles from '../../../pages/campus_map/styles/sidebar.module.css';
=======
import SkeletonBlock from '../common/loading_state/SkeletonBlock';
import baseStyles from '../../pages/campus_map/CampusMap.module.css';
import sidebarStyles from '../../pages/campus_map/sidebar.module.css';
>>>>>>> main:flax-10-project-files/frontend/src/components/campus_map/CampusMapSkeleton.jsx
const styles = { ...baseStyles, ...sidebarStyles };

function SkeletonSectionList() {
  return Array.from({ length: 4 }).map((_, i) => (
    <section key={i} className={styles.section}>
      <SkeletonBlock className={styles.skeletonSectionLabel} />
      <SkeletonBlock className={styles.skeletonPanelCard} />
      <SkeletonBlock className={styles.skeletonPanelCardTall} />
    </section>
  ));
}

function SkeletonNavList() {
  return Array.from({ length: 4 }).map((_, i) => (
    <SkeletonBlock key={i} className={styles.skeletonQuickNavBtn} />
  ));
}

export function CampusMapSkeleton() {
  return (
    <div className={styles.skeletonOverlay} data-testid="campus-map-skeleton" aria-busy="true">
      <aside className={styles.sidebar}>
        <section className={styles.sidebarHeader}>
          <SkeletonBlock className={styles.skeletonSidebarTitle} />
          <SkeletonBlock className={styles.skeletonSidebarSubtitle} />
        </section>
        <SkeletonSectionList />
      </aside>
      <div className={styles.mapWrapper}>
        <SkeletonBlock className={styles.skeletonMapPane} />
        <div className={styles.campusQuickNav}>
          <SkeletonNavList />
        </div>
      </div>
    </div>
  );
}
