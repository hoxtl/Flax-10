import SkeletonBlock from '../common/LoadingState/SkeletonBlock';
import baseStyles from '../../pages/CampusMap/CampusMap.module.css';
import sidebarStyles from '../../pages/CampusMap/sidebar.module.css';
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
