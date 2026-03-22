/*
 * GroupWork detail loading skeleton.
 */

import SkeletonBlock from "../../../components/Common/LoadingState/SkeletonBlock";
import BackButton from "../../../components/Common/BackButton/BackButton.jsx";
import styles from "./GroupWorkDetailSkeleton.module.css";

const MEMBER_SLOTS = [0, 1, 2];
const TASK_SLOTS = [0, 1, 2, 3];

export default function GroupWorkDetailSkeleton({ onBack }) {
  return (
    <div className={styles.container} data-testid="groupwork-skeleton" aria-busy="true">
      <SkeletonTopActions onBack={onBack} />
      <SkeletonHeader />
      <SkeletonMembers />
      <SkeletonAddMemberForm />
      <SkeletonTabs />
    </div>
  );
}

function SkeletonTopActions({ onBack }) {
  return (
    <div className={styles.topActions}>
      <BackButton onClick={onBack} label="Back to All Projects" />
      <SkeletonBlock className={styles.skeletonDeleteBtn} />
    </div>
  );
}

function SkeletonHeader() {
  return (
    <section className={styles.headerSection}>
      <div className={styles.headerBody}>
        <SkeletonBlock className={styles.skeletonProjectMeta} />
        <SkeletonBlock className={styles.skeletonProjectTitle} />
        <SkeletonMetaRow />
        <SkeletonBlock className={styles.skeletonProgressBar} />
      </div>
    </section>
  );
}

function SkeletonMetaRow() {
  return (
    <div className={styles.skeletonMetaRow}>
      <SkeletonBlock className={styles.skeletonMetaItem} />
      <SkeletonBlock className={styles.skeletonMetaItemWide} />
    </div>
  );
}

function SkeletonMembers() {
  return (
    <section className={styles.membersSection}>
      <SkeletonBlock className={styles.skeletonMembersTitle} />
      <div className={styles.membersList}>
        {MEMBER_SLOTS.map((index) => <SkeletonMember key={index} />)}
      </div>
    </section>
  );
}

function SkeletonMember() {
  return (
    <div className={styles.skeletonMemberPill}>
      <SkeletonBlock className={styles.skeletonAvatar} />
      <SkeletonBlock className={styles.skeletonMemberName} />
    </div>
  );
}

function SkeletonAddMemberForm() {
  return (
    <div className={styles.skeletonAddMemberForm}>
      <SkeletonBlock className={styles.skeletonAddMemberInput} />
      <SkeletonBlock className={styles.skeletonAddMemberBtn} />
    </div>
  );
}

function SkeletonTabs() {
  return (
    <section className={styles.tabsSection}>
      <div className={styles.tabsRow}>
        <SkeletonBlock className={styles.skeletonTab} />
        <SkeletonBlock className={styles.skeletonTab} />
      </div>
      <div className={styles.skeletonTaskPanel}>
        {TASK_SLOTS.map((index) => <SkeletonBlock key={index} className={styles.skeletonTaskRow} />)}
      </div>
    </section>
  );
}
