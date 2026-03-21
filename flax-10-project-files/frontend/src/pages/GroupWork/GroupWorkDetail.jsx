/*
 * GroupWork detail page.
 */

import { FolderOpen } from "lucide-react";
import AppPage from "../../components/common/AppPage/AppPage";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import { useProjectDetail } from "./groupWorkHooks";
import GroupWorkDetailSkeleton from "./components/GroupWorkDetailSkeleton";
import ProjectHeader from "./components/ProjectHeader";
import TabsSection from "./components/TabsSection";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
import { BackToTop } from "../../components/Pagination/Pagination";
import { getVisibleMembers } from "./utils/projectRowUtils";
import styles from "./GroupWorkDetail.module.css";

export default function GroupProjectDetail({ projectId, onBack, onDelete, onUpdate }) {
  const detail = useProjectDetail(projectId, onBack, onDelete, onUpdate);
  if (detail.loading) return <GroupWorkDetailSkeleton onBack={onBack} />;
  if (!detail.project) return <MissingProjectState onBack={onBack} />;
  return <ProjectDetailContent detail={detail} projectId={projectId} onBack={onBack} />;
}

function MissingProjectState({ onBack }) {
  return (
    <AppPage className={styles.page} contentClassName={styles.pageContent}>
      <div className={styles.surface}>
        <BackButton onClick={onBack} label="Back to My Group Projects" />
        <div className={styles.emptyStateWrap}>
          <EmptyState
            icon={<FolderOpen size={24} />}
            title="This group project isn’t available right now."
            description="It may have been removed, or you may no longer have access to it."
          />
        </div>
      </div>
    </AppPage>
  );
}

function ProjectDetailContent({ detail, projectId, onBack }) {
  const visibleMembers = getVisibleMembers(detail.members);
  return (
    <>
      <AppPage className={styles.page} contentClassName={styles.pageContent}>
        <div className={styles.surface}>
          <ProjectHeader project={detail.project} members={visibleMembers} onDelete={detail.handleDeleteProject} onBack={onBack} />
          <TabsSection activeTab={detail.activeTab} setActiveTab={detail.setActiveTab} projectId={projectId} members={detail.members} onStatsUpdate={detail.setTaskStats} taskStats={detail.taskStats} />
        </div>
      </AppPage>
      <BackToTop />
    </>
  );
}
