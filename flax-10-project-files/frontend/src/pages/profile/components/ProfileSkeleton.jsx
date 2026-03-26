/**
 * Profile loading skeleton.
 */

import styles from "../ProfilePage.module.css";

function SkeletonHeader() {
  return (
    <div className={styles.skelHeader}>
      <div className={styles.skelAvatar} />
      <div className={styles.skelHeaderInfo}>
        <div className={styles.skelName} />
        <div className={styles.skelBio} />
        <div className={styles.skelStatsRow}>
          <div className={styles.skelStat} />
          <div className={styles.skelStat} />
          <div className={styles.skelStat} />
        </div>
      </div>
    </div>
  );
}

function SkeletonBody({ blocks }) {
  return (
    <div className={styles.skelBody}>
      <div className={styles.skelLeftCol}>{blocks}</div>
      <div className={styles.skelRightCol}>
        <div className={styles.skelWidget} />
        <div className={styles.skelWidget} />
        <div className={styles.skelWidget} />
      </div>
    </div>
  );
}

export default function ProfileSkeleton({ blocks }) {
  return (
    <div className={`${styles.container} ${styles.fullSkelContainer}`}>
      <SkeletonHeader />
      <SkeletonBody blocks={blocks} />
    </div>
  );
}
