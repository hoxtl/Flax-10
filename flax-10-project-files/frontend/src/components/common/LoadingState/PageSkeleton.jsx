/*
 * Full-page loading skeleton with configurable grid layout.
 */

import styles from "./PageSkeleton.module.css";
import SkeletonBlock from "./SkeletonBlock";

function SkeletonGrid({ cardCount, cardHeight, columns }) {
  return (
    <div className={styles.grid} style={{ "--page-skeleton-columns": columns }}>
      {Array.from({ length: cardCount }).map((_, index) => (
        <SkeletonBlock key={index} className={styles.card}
          style={{ height: cardHeight, animationDelay: `${index * 0.08}s` }} />
      ))}
    </div>
  );
}

/** Page-level loading skeleton with a header, optional search bar, and card grid. */
export default function PageSkeleton({ label = "Loading page", showAction = false, showSearch = false, cardCount = 6, cardHeight = "180px", columns = 3, testId }) {
  return (
    <div className={styles.container} aria-busy="true" data-testid={testId}>
      <span className={styles.srOnly}>{label}</span>
      <div className={styles.header}>
        <SkeletonBlock className={styles.title} />
        {showAction && <SkeletonBlock className={styles.action} />}
      </div>
      {showSearch && <SkeletonBlock className={styles.search} />}
      <SkeletonGrid cardCount={cardCount} cardHeight={cardHeight} columns={columns} />
    </div>
  );
}
