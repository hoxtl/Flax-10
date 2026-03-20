import React, { useEffect } from "react";
import { useProjectDetail } from "./groupWorkHooks";
import GroupWorkDetailSkeleton from "./components/GroupWorkDetailSkeleton";
import ProjectHeader from "./components/ProjectHeader";
import MembersSection from "./components/MembersSection";
import AddMemberForm from "./components/AddMemberForm";
import TabsSection from "./components/TabsSection";
import BackButton from "./components/BackButton";
import styles from "./GroupWorkDetail.module.css";

function useSyncStats(d, onUpdate) {
  useEffect(() => {
    if (!onUpdate || !d.project || d.taskStats.total === undefined) return;
    
    const countsMatch = d.project.task_count === d.taskStats.total && 
                        d.project.completed_task_count === d.taskStats.completed;
    const membersMatch = (d.project.members || []).length === d.members.length;

    if (countsMatch && membersMatch) return;

    const statsAreValid = d.taskStats.total > 0 || d.project.task_count === 0;
    if (statsAreValid || !membersMatch) {
        onUpdate({
          ...d.project,
          task_count: d.taskStats.total,
          completed_task_count: d.taskStats.completed,
          members: d.members,
          member_count: d.members.length
        });
    }
  }, [d.taskStats.total, d.taskStats.completed, d.members, d.project, onUpdate]);
}

export default function GroupProjectDetail({ projectId, onBack, onDelete, onUpdate }) {
  const d = useProjectDetail(projectId, onBack, onDelete, onUpdate);
  useSyncStats(d, onUpdate);

  if (d.loading) return <GroupWorkDetailSkeleton onBack={onBack} />;
  
  if (!d.project) {
    return (
      <div className={styles.container}>
        <BackButton onClick={onBack} />
        <p className={styles.empty}>Project not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ProjectHeader 
        project={d.project} 
        members={d.members} 
        onPatch={d.patchProject} 
        taskStats={d.taskStats} 
        onDelete={d.handleDeleteProject}
      />
      <MembersSection members={d.members} onRemove={d.handleRemoveMember} />
      <AddMemberForm projectId={projectId} onAdded={d.onAdded} />
      <TabsSection 
        activeTab={d.activeTab} 
        setActiveTab={d.setActiveTab} 
        projectId={projectId} 
        members={d.members} 
        onStatsUpdate={d.setTaskStats} 
      />
    </div>
  );
}
