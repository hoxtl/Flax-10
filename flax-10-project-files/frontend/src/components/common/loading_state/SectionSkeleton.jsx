/*
 * Section-level loading skeleton with header rows and an optional button placeholder.
 */

import styles from "./SectionSkeleton.module.css";
import SkeletonBlock from "./SkeletonBlock";

function SkeletonHeader() {
  return (
    <div className={styles.header}>
      <SkeletonBlock className={styles.title} />
      <SkeletonBlock className={styles.subtitle} />
    </div>
  );
}

/** Section loading skeleton with configurable row count and optional header and button. */

export default function SectionSkeleton({ label = "Loading section", rows = 3, showHeader = true, showButton = true }) {
  return (
    <div className={styles.wrap} aria-busy="true" aria-label={label}>
      {showHeader && <SkeletonHeader />}
      <div className={styles.body}>
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonBlock key={index} className={styles.row} />
        ))}
      </div>
      {showButton && <SkeletonBlock className={styles.button} />}
    </div>
  );
}
