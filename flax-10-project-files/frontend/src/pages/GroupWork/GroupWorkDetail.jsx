import { useState } from "react";
import UserSearch from "../../components/Social/UserSearch";
import { getAuthHeaders, useProject, useProjectMembers, useSelectedTab } from "./groupWorkHooks";
import { getUserColor } from "./utils/priorityUtils";
import GroupTasksTab from "./GroupTasksTab";
import AvailabilityTab from "./AvailabilityTab";
import MemberAvatar from "./components/MemberAvatar";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import UserModuleDropdown from "../../components/Modules/UserModuleDropdown";
import styles from "./GroupWorkDetail.module.css";

function GroupWorkDetailSkeleton({ onBack }) {
  return (
    <div className={styles.container} data-testid="groupwork-skeleton" aria-busy="true">
      <div className={styles.topBar}>
        <BackButton onClick={onBack} />
        <SkeletonBlock className={styles.skeletonDeleteBtn} />
      </div>
      <section className={styles.headerSection}>
        <div className={styles.headerInfo}>
          <SkeletonBlock className={styles.skeletonProjectTitle} />
          <SkeletonBlock className={styles.skeletonProjectMeta} />
          <SkeletonBlock className={styles.skeletonProgressBar} />
          <SkeletonBlock className={styles.skeletonStats} />
        </div>
        <SkeletonBlock className={styles.skeletonDeadlinePill} />
      </section>
      <section className={styles.membersSection}>
        <SkeletonBlock className={styles.skeletonMembersTitle} />
        <div className={styles.membersList}>
          {Array.from({ length: 3 }).map((_, index) => (
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
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className={styles.skeletonTaskRow} />
          ))}
        </div>
      </section>
    </div>
  );
}

function BackButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className={styles.backButton}>
      <span>←</span>
      <span>Back to all projects</span>
    </button>
  );
}

function AddMemberForm({ projectId, onAdded }) {
  const handleSelect = async (user) => {
    if (!user?.id) return;
    const body = JSON.stringify({ user: user.id, role: "member" });
    const res = await fetch(`/api/group-work/projects/${projectId}/members/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body,
    });
    if (res.ok) onAdded(await res.json());
  };
  return (
    <div className={styles.addMemberForm}>
      <UserSearch
        onUserSelect={handleSelect}
        fullWidth
        hideFilter
        compact
      />
    </div>
  );
}

function MemberPill({ member, onRemove }) {
  return (
    <div className={styles.memberPill}>
      <MemberAvatar member={member} size={24} />
      <span>{member.user_name}</span>
      {member.role !== "owner" && (
        <button type="button" onClick={() => onRemove(member.id)} className={styles.removeBtn}>Remove</button>
      )}
    </div>
  );
}

function MembersSection({ members, onRemove }) {
  return (
    <section className={styles.membersSection}>
      <h2 className={styles.membersTitle}>Members</h2>
      <div className={styles.membersList}>
        {members.map((m) => <MemberPill key={m.id} member={m} onRemove={onRemove} />)}
        {members.length === 0 && <p className={styles.metaText}>No members yet. Add your first member below.</p>}
      </div>
    </section>
  );
}

function ProgressSegments({ segments, hoveredSeg, setHoveredSeg }) {
  return segments.map((seg, idx) => (
    <div key={seg.id ?? idx} className={styles.progressSegment} style={{ width: `${seg.percentage}%`, background: seg.id === 'unassigned' ? '#c0b8b0' : getUserColor(seg.id), opacity: hoveredSeg && hoveredSeg !== (seg.id ?? idx) ? 0.65 : 1 }} onMouseEnter={() => setHoveredSeg(seg.id ?? idx)} onMouseLeave={() => setHoveredSeg(null)} />
  ));
}

function ProjectProgress({ taskStats }) {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const segments = taskStats.segments || [];
  const hovered = hoveredSeg !== null ? segments.find(s => (s.id ?? s.name) === hoveredSeg) || segments[hoveredSeg] : null;
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBarOuter}>
        <div className={styles.progressBarInner}><ProgressSegments segments={segments} hoveredSeg={hoveredSeg} setHoveredSeg={setHoveredSeg} /></div>
        {hovered && <div className={styles.progressTooltip}><span className={styles.tooltipDot} style={{ background: hovered.id === 'unassigned' ? '#c0b8b0' : getUserColor(hovered.id) }} />{hovered.tooltip || hovered.name}</div>}
      </div>
      <p className={styles.statsText}>{taskStats.completed} / {taskStats.total} tasks complete · {taskStats.percent}% complete</p>
    </div>
  );
}

function ProjectHeader({ project, members, onPatch, taskStats }) {
    const onName = e => { const v = e.target.value.trim(); if (v && v !== project.name) onPatch({ name: v }); };
    const onCourse = val => onPatch({ course_code: val });
    const onDeadline = e => onPatch({ deadline: e.target.value ? new Date(e.target.value).toISOString() : null });
    return (
        <section className={styles.headerSection}>
            <div className={styles.headerInfo}>
                <input defaultValue={project.name} onBlur={onName} className={styles.nameInput} />
                <div className={styles.metaRow}>
                    <div className={styles.courseDropdownWrapper}>
                        <UserModuleDropdown
                            value={project.course_code || ""}
                            onChange={onCourse}
                            placeholder="Module code"
                            className={styles.detailCourseDropdown}
                        />
                    </div>
                    <span> · {project.member_count ?? members.length} members</span>
                </div>
                <ProjectProgress taskStats={taskStats} />
            </div>
            <div className={styles.deadlinePill}>
                <span>🗓</span>
                <input type="date" defaultValue={project.deadline?.slice(0, 10) ?? ""} onBlur={onDeadline} className={styles.dateInput} />
            </div>
        </section>
    );
}

function TabsSection({ activeTab, setActiveTab, projectId, members, onStatsUpdate }) {
  const t = (id, label) => (
    <button type="button" className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`} onClick={() => setActiveTab(id)}>
      {label}
    </button>
  );
  return (
    <section className={styles.tabsSection}>
      <div className={styles.tabsRow}>
        {t("tasks", "Tasks")}
        {t("availability", "Availability")}
      </div>
      {activeTab === "tasks" && <GroupTasksTab projectId={projectId} members={members} onStatsUpdate={onStatsUpdate} />}
      {activeTab === "availability" && <AvailabilityTab projectId={projectId} />}
    </section>
  );
}

function useProjectActions(projectId, setProject, setMembers, onBack, onDelete) {
  const patchProject = async p => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, { method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(p) });
    if (res.ok) setProject(await res.json());
  };
  const handleRemoveMember = async mid => {
    const res = await fetch(`/api/group-work/projects/${projectId}/members/${mid}/`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) setMembers(prev => prev.filter(i => i.id !== mid));
  };
  const handleDeleteProject = async () => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) {
        if (onDelete) onDelete(projectId);
        onBack();
    }
  };
  return { patchProject, handleRemoveMember, handleDeleteProject };
}

function useProjectDetail(projectId, onBack, onDelete) {
  const { project, setProject, loading } = useProject(projectId);
  const { members, setMembers } = useProjectMembers(projectId);
  const initialTab = useSelectedTab();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [taskStats, setTaskStats] = useState({ percent: 0, completed: 0, total: 0, segments: [] });
  const { patchProject, handleRemoveMember, handleDeleteProject } = useProjectActions(projectId, setProject, setMembers, onBack, onDelete);
  const onAdded = m => setMembers(p => p.some(i => i.id === m.id) ? p : [...p, m]);
  return { project, loading, members, activeTab, setActiveTab, taskStats, setTaskStats, onAdded, patchProject, handleRemoveMember, handleDeleteProject };
}

export default function GroupProjectDetail({ projectId, onBack, onDelete }) {
  const d = useProjectDetail(projectId, onBack, onDelete);
  if (d.loading) return <GroupWorkDetailSkeleton onBack={onBack} />;
  if (!d.project) return <div className={styles.container}><BackButton onClick={onBack} /><p className={styles.empty}>Project not found.</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <BackButton onClick={onBack} />
        <button type="button" onClick={d.handleDeleteProject} className={styles.deleteProjectBtn}>Delete project</button>
      </div>
      <ProjectHeader project={d.project} members={d.members} onPatch={d.patchProject} taskStats={d.taskStats} />
      <MembersSection members={d.members} onRemove={d.handleRemoveMember} />
      <AddMemberForm projectId={projectId} onAdded={d.onAdded} />
      <TabsSection activeTab={d.activeTab} setActiveTab={d.setActiveTab} projectId={projectId} members={d.members} onStatsUpdate={d.setTaskStats} />
    </div>
  );
}
