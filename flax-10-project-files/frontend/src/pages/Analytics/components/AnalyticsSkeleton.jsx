/*
 * Analytics loading skeleton.
 */

<<<<<<< HEAD
import SkeletonBlock from '../../../components/common/loading_state/SkeletonBlock';
=======
import SkeletonBlock from '../../../components/common/LoadingState/SkeletonBlock';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from '../AnalyticsPage.module.css';

const PERIOD_PLACEHOLDERS = [0, 1, 2];
const SUMMARY_PLACEHOLDERS = [0, 1, 2, 3];

const renderPeriodPlaceholder = (index) => (
  <SkeletonBlock key={index} className={styles.skeletonPeriodBtn} />
);

const renderSummaryPlaceholder = (index) => (
  <SkeletonBlock key={index} className={styles.skeletonSummaryCard} />
);

function SkeletonHeader() {
  return (
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonTitleGroup}>
        <SkeletonBlock className={styles.skeletonTitle} />
        <SkeletonBlock className={styles.skeletonSubtitle} />
      </div>
      <div className={styles.skeletonPeriodToggle}>{PERIOD_PLACEHOLDERS.map(renderPeriodPlaceholder)}</div>
    </div>
  );
}

function SkeletonTabs() {
  return (
    <div className={styles.skeletonTabs}>
      <SkeletonBlock className={styles.skeletonTab} />
      <SkeletonBlock className={styles.skeletonTab} />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <>
      <div className={styles.skeletonSummaryGrid}>{SUMMARY_PLACEHOLDERS.map(renderSummaryPlaceholder)}</div>
      <div className={styles.skeletonAnalyticsGrid}>
        <SkeletonBlock className={styles.skeletonAnalyticsCardTall} />
        <SkeletonBlock className={styles.skeletonAnalyticsCardTall} />
        <SkeletonBlock className={styles.skeletonAnalyticsCardWide} />
        <SkeletonBlock className={styles.skeletonAnalyticsCardWide} />
      </div>
    </>
  );
}

export default function AnalyticsSkeleton() {
  return (
    <div className={styles.page} aria-busy="true">
      <SkeletonHeader />
      <SkeletonTabs />
      <SkeletonGrid />
    </div>
  );
}
