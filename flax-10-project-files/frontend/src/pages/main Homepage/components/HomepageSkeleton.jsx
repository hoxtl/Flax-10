/**
 * Homepage loading skeleton.
 */

import SkeletonBlock from "../../../components/common/LoadingState/SkeletonBlock";
import styles from "../Homepage.module.css";

export function HomepageSkeleton() {
  return (
    <div className={styles.routeSkeleton} aria-busy="true">
      <div className={styles.routeSkeletonTop}>
        <SkeletonBlock className={styles.routeSkeletonBanner} />
        <div className={styles.routeSkeletonGrid}>
          <SkeletonBlock className={styles.routeSkeletonCardLarge} />
          <SkeletonBlock className={styles.routeSkeletonCardLarge} />
          <SkeletonBlock className={styles.routeSkeletonCardMedium} />
        </div>
      </div>
      <div className={styles.routeSkeletonTimeline}>
        <SkeletonRows />
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      <div className={styles.routeSkeletonTimelineHeader}>
        <SkeletonBlock className={styles.routeSkeletonTimelineTitle} />
        <SkeletonBlock className={styles.routeSkeletonTimelineAction} />
      </div>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className={styles.routeSkeletonTimelineRow}>
          <SkeletonBlock className={styles.routeSkeletonTime} />
          <SkeletonBlock className={styles.routeSkeletonEvent} />
        </div>
      ))}
    </>
  );
}
