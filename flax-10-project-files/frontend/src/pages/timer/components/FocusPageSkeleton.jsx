/*
 * Timer page skeleton placeholder.
 */

import styles from '../TimerPage.module.css';
<<<<<<< HEAD
import SkeletonBlock from '../../../components/common/loading_state/SkeletonBlock';
=======
import SkeletonBlock from '../../../components/common/LoadingState/SkeletonBlock';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

function SkeletonControls() {
  return (
    <div className={styles.focusPageSkeletonControls}>
      <SkeletonBlock className={styles.focusPageSkeletonBtnPrimary} />
      <SkeletonBlock className={styles.focusPageSkeletonBtnSecondary} />
      <SkeletonBlock className={styles.focusPageSkeletonBtnSecondary} />
    </div>
  );
}

function SkeletonSetting() {
  return (
    <div className={styles.focusPageSkeletonSetting}>
      <SkeletonBlock className={styles.focusPageSkeletonLabel} />
      <SkeletonBlock className={styles.focusPageSkeletonInput} />
    </div>
  );
}

function SkeletonSettings() {
  return (
    <div className={styles.focusPageSkeletonSettings}>
      <SkeletonSetting />
      <SkeletonSetting />
      <SkeletonSetting />
    </div>
  );
}

function SkeletonMainColumn() {
  return (
    <div className={styles.focusPageSkeletonMainCol}>
      <SkeletonBlock className={styles.focusPageSkeletonTask} />
      <SkeletonBlock className={styles.focusPageSkeletonTree} />
      <SkeletonBlock className={styles.focusPageSkeletonBadge} />
      <SkeletonBlock className={styles.focusPageSkeletonTime} />
      <SkeletonControls />
      <SkeletonSettings />
    </div>
  );
}

function SkeletonRightColumn() {
  return (
    <div className={styles.focusPageSkeletonRightCol}>
      <SkeletonBlock className={styles.focusPageSkeletonRightCard} />
      <SkeletonBlock className={styles.focusPageSkeletonRightCardTall} />
    </div>
  );
}

export function FocusPageSkeleton() {
  return (
    <div className={styles.focusPageSkeleton} data-testid="focus-page-skeleton" aria-busy="true">
      <div className={styles.focusPageSkeletonHeader}>
        <SkeletonBlock className={styles.focusPageSkeletonTitle} />
        <SkeletonBlock className={styles.focusPageSkeletonAction} />
      </div>
      <div className={styles.focusPageSkeletonCanvas}>
        <SkeletonMainColumn />
        <SkeletonRightColumn />
      </div>
    </div>
  );
}
