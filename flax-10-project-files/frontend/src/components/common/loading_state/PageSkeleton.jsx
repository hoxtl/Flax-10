/*
 * Full-page loading skeleton with optional header, search, action, and card grid.
 */

import styles from "./PageSkeleton.module.css";
import SkeletonBlock from "./SkeletonBlock";

function SkeletonCards({ count }) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.card}>
          <SkeletonBlock />
        </div>
      ))}
    </div>
  );
}

function SkeletonHeader({ showAction }) {
  return <div className={styles.header}><SkeletonBlock className={styles.title} />{showAction && <SkeletonBlock className={styles.action} />}</div>;
}

export default function PageSkeleton({ label = "Loading page", showAction = false, showSearch = false, cardCount = 3, testId }) {
  return (
    <div className={styles.container} aria-busy="true" data-testid={testId}>
      <span className={styles.srOnly}>{label}</span>
      <SkeletonHeader showAction={showAction} />
      {showSearch && <SkeletonBlock className={styles.search} />}
      <SkeletonCards count={cardCount} />
    </div>
  );
}
