/*
 * Loading skeleton for the tasks page shell.
 */

import styles from "./TasksPage.module.css";

function SkeletonRows({ count, className, step }) {
  return [...Array(count)].map((_, index) => (
    <div
      key={index}
      className={`${styles.skel} ${className}`}
      style={{ animationDelay: `${index * step}s` }}
    />
  ));
}

function SidebarSkeleton() {
  return (
    <div className={styles.skelSidebar}>
      <div className={`${styles.skel} ${styles.skelSidebarTitle}`} />
      {SkeletonRows({ count: 3, className: styles.skelSidebarRow, step: 0.08 })}
      <div className={styles.skelDivider} />
      {SkeletonRows({ count: 4, className: styles.skelSidebarRow, step: 0.08 })}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className={styles.skelFeed}>
      <div className={`${styles.skel} ${styles.skelFeedHeader}`} />
      {SkeletonRows({ count: 5, className: styles.skelTaskRow, step: 0.06 })}
    </div>
  );
}

export default function TasksPageSkeleton() {
  return (
    <div className={styles.page} data-testid="tasks-skeleton">
      <SidebarSkeleton />
      <FeedSkeleton />
    </div>
  );
}
