/*
 * GroupWork detail page.
 */

import { useProjectDetail } from "./groupWorkHooks";
import GroupWorkDetailSkeleton from "./components/GroupWorkDetailSkeleton";
import ProjectHeader from "./components/ProjectHeader";
import MembersSection from "./components/MembersSection";
import AddMemberForm from "./components/AddMemberForm";
import TabsSection from "./components/TabsSection";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
import styles from "./GroupWorkDetail.module.css";

export default function GroupProjectDetail({ projectId, onBack, onDelete, onUpdate }) {
  const detail = useProjectDetail(projectId, onBack, onDelete, onUpdate);
  if (detail.loading) return <GroupWorkDetailSkeleton onBack={onBack} />;
  if (!detail.project) return <MissingProjectState onBack={onBack} />;
  return <ProjectDetailContent detail={detail} projectId={projectId} onBack={onBack} />;
}

function MissingProjectState({ onBack }) {
  return (
    <div className={styles.container}>
      <BackButton onClick={onBack} label="Back to All Projects" />
      <p className={styles.empty}>Project not found.</p>
    </div>
  );
}

function ProjectDetailContent({ detail, projectId, onBack }) {
  return (
    <div className={styles.container}>
      <ProjectHeader project={detail.project} members={detail.members} onPatch={detail.patchProject} taskStats={detail.taskStats} onDelete={detail.handleDeleteProject} onBack={onBack} />
      <MembersSection members={detail.members} onRemove={detail.handleRemoveMember} />
      <AddMemberForm projectId={projectId} onAdded={detail.onAdded} />
      <TabsSection activeTab={detail.activeTab} setActiveTab={detail.setActiveTab} projectId={projectId} members={detail.members} onStatsUpdate={detail.setTaskStats} />
    </div>
  );
}
