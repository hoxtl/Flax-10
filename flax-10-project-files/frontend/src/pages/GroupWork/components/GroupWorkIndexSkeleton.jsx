import React from "react";
import SkeletonBlock from "../../../components/Common/LoadingState/SkeletonBlock";
import styles from "./GroupWorkIndexSkeleton.module.css";

export default function GroupWorkIndexSkeleton() {
  const SKELETON_ITEMS = [1, 2, 3, 4];

  return (
    <div className={styles.skeletonContainer} data-testid="groupwork-skeleton">
      <div className={styles.skeletonStats}>
        {SKELETON_ITEMS.map((i) => (
          <SkeletonBlock key={i} className={styles.skeletonStatCard} height="100px" />
        ))}
      </div>
      <SkeletonBlock className={styles.skeletonForm} height="200px" />
      <div className={styles.skeletonList}>
        {SKELETON_ITEMS.map((i) => (
          <SkeletonBlock key={i} className={styles.skeletonRow} height="80px" />
        ))}
      </div>
    </div>
  );
}
