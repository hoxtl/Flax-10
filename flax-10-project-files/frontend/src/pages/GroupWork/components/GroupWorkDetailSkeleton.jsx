import React from "react";
import SkeletonBlock from "../../../components/common/LoadingState/SkeletonBlock";
import BackButton from "./BackButton";
import styles from "./GroupWorkDetailSkeleton.module.css";

export default function GroupWorkDetailSkeleton({ onBack }) {
  const SKELETON_MEMBERS = 3;
  const SKELETON_TASKS = 4;

  return (
    <div className={styles.container} data-testid="groupwork-skeleton" aria-busy="true">
      <div className={styles.topActions}>
        <BackButton onClick={onBack} />
        <SkeletonBlock className={styles.skeletonDeleteBtn} />
      </div>
      <section className={styles.headerSection}>
        <div className={styles.headerBody}>
          <SkeletonBlock className={styles.skeletonProjectMeta} />
          <SkeletonBlock className={styles.skeletonProjectTitle} />
          <div className={styles.skeletonMetaRow}>
            <SkeletonBlock className={styles.skeletonMetaItem} />
            <SkeletonBlock className={styles.skeletonMetaItemWide} />
          </div>
          <SkeletonBlock className={styles.skeletonProgressBar} />
        </div>
      </section>
      <section className={styles.membersSection}>
        <SkeletonBlock className={styles.skeletonMembersTitle} />
        <div className={styles.membersList}>
          {Array.from({ length: SKELETON_MEMBERS }).map((_, index) => (
            <div key={index} className={styles.skeletonMemberPill}>
              <SkeletonBlock className={styles.skeletonAvatar} />
              <SkeletonBlock className={styles.skeletonMemberName} />
            </div>
          ))}
        </div>
      </section>
      <div className={styles.skeletonAddMemberForm}>
        <SkeletonBlock className={styles.skeletonAddMemberInput} />
        <SkeletonBlock className={styles.skeletonAddMemberBtn} />
      </div>
      <section className={styles.tabsSection}>
        <div className={styles.tabsRow}>
          <SkeletonBlock className={styles.skeletonTab} />
          <SkeletonBlock className={styles.skeletonTab} />
        </div>
        <div className={styles.skeletonTaskPanel}>
          {Array.from({ length: SKELETON_TASKS }).map((_, index) => (
            <SkeletonBlock key={index} className={styles.skeletonTaskRow} />
          ))}
        </div>
      </section>
    </div>
  );
}
