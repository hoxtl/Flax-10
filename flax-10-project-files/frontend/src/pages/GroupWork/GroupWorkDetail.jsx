/**
 * GroupWorkDetail — main project detail page.
 * All styles live in GroupWorkDetail.module.css.
 */
import { useState } from "react";
import { getAuthHeaders, useProject, useProjectMembers } from "./groupWorkHooks";
import { getUserColor } from "./utils/priorityUtils";
import GroupTasksTab from "./GroupTasksTab";
import AvailabilityTab from "./AvailabilityTab";
import MemberAvatar from "./components/MemberAvatar";
import styles from "./GroupWorkDetail.module.css";

// ---------------------------------------------------------------------------
// Small presentational sub-components
// ---------------------------------------------------------------------------

function BackButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className={styles.backButton}>
      <span>←</span>
      <span>Back to all projects</span>
    </button>
  );
}

function ProgressTooltip({ seg }) {
  const bg = seg.id === "unassigned" ? "#c0b8b0" : getUserColor(seg.id);
  return (
    <div className={styles.progressTooltip}>
      <span className={styles.tooltipDot} style={{ background: bg }} />
      {seg.tooltip || seg.name}
    </div>
  );
}

function ProgressSegment({ seg, idx, hoveredSeg, onEnter, onLeave }) {
  const bg = seg.id === "unassigned" ? "#c0b8b0" : getUserColor(seg.id);
  const key = seg.id ?? idx;
  return (
    <div
      className={styles.progressSegment}
      style={{ width: `${seg.percentage}%`, background: bg, opacity: hoveredSeg && hoveredSeg !== key ? 0.65 : 1 }}
      onMouseEnter={() => onEnter(key)}
      onMouseLeave={onLeave}
    />
  );
}

function ProgressBar({ taskStats }) {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const segments = taskStats.segments || [];
  const hovered = hoveredSeg !== null ? segments.find(s => (s.id ?? s.name) === hoveredSeg) || segments[hoveredSeg] : null;
  return (
    <div className={styles.progressBarOuter}>
      <div className={styles.progressBarInner}>
        {segments.map((seg, idx) => (
          <ProgressSegment key={seg.id ?? idx} seg={seg} idx={idx} hoveredSeg={hoveredSeg} onEnter={setHoveredSeg} onLeave={() => setHoveredSeg(null)} />
        ))}
      </div>
      {hovered && <ProgressTooltip seg={hovered} />}
    </div>
  );
}

function ProjectHeader({ project, members, onPatch, taskStats }) {
  const handleNameBlur = e => { const v = e.target.value.trim(); if (v && v !== project.name) onPatch({ name: v }); };
  const handleCourseBlur = e => onPatch({ course_code: e.target.value.trim() });
  const handleDeadlineBlur = e => onPatch({ deadline: e.target.value ? new Date(e.target.value).toISOString() : null });
  const memberCount = (project.member_count ?? members.length) || 0;
  return (
    <div className={styles.projectHeaderRow}>
      <div className={styles.projectLeft}>
        <input defaultValue={project.name} onBlur={handleNameBlur} className={styles.projectNameInput} />
        <p>
          <input defaultValue={project.course_code || ""} placeholder="Course code" onBlur={handleCourseBlur} className={styles.courseCodeInput} />
          · {memberCount} members
        </p>
        <ProgressBar taskStats={taskStats} />
        <p>{taskStats.completed} / {taskStats.total} tasks complete · {taskStats.percent}% complete</p>
      </div>
      <div className={styles.deadlinePill}>
        <span>🗓</span>
        <input type="date" defaultValue={project.deadline?.slice(0, 10) ?? ""} onBlur={handleDeadlineBlur} className={styles.deadlineInput} />
      </div>
    </div>
  );
}

function MemberPill({ member, onRemove }) {
  return (
    <div className={styles.memberPill}>
      <MemberAvatar member={member} size={24} />
      <span>{member.first_name ? `${member.first_name} ${member.last_name || ""}`.trim() : member.user_name}</span>
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
        {members.map(m => <MemberPill key={m.id} member={m} onRemove={onRemove} />)}
        {members.length === 0 && <p>No members yet. Add your first member below.</p>}
      </div>
    </section>
  );
}

function AddMemberForm({ projectId, onAdded }) {
  const [userId, setUserId] = useState("");
  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId.trim()) return;
    const res = await fetch(`/api/group-work/projects/${projectId}/members/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ user: Number(userId), role: "member" }),
    });
    if (!res.ok) return;
    onAdded(await res.json());
    setUserId("");
  };
  return (
    <form onSubmit={handleSubmit} className={styles.addMemberForm}>
      <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Add member by user ID" className={styles.addMemberInput} />
      <button type="submit" className={styles.addMemberBtn}>Add</button>
    </form>
  );
}

function TabsSection({ activeTab, setActiveTab, projectId, members, onStatsUpdate }) {
  return (
    <section>
      <div className={styles.tabsRow}>
        <button type="button" className={`${styles.tab} ${activeTab === "tasks" ? styles.tabActive : ""}`} onClick={() => setActiveTab("tasks")}>Tasks</button>
        <button type="button" className={`${styles.tab} ${activeTab === "availability" ? styles.tabActive : ""}`} onClick={() => setActiveTab("availability")}>Availability</button>
      </div>
      {activeTab === "tasks" && <GroupTasksTab projectId={projectId} members={members} onStatsUpdate={onStatsUpdate} />}
      {activeTab === "availability" && <AvailabilityTab projectId={projectId} />}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main exported component
// ---------------------------------------------------------------------------

function useProjectDetail(projectId, onBack) {
  const { project, setProject, loading } = useProject(projectId);
  const { members, setMembers } = useProjectMembers(projectId);
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskStats, setTaskStats] = useState({ percent: 0, completed: 0, total: 0, segments: [] });

  const patchProject = async partial => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, { method: "PATCH", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify(partial) });
    if (res.ok) setProject(await res.json());
  };

  const handleMemberAdded = membership =>
    setMembers(prev => prev.some(i => i.id === membership.id) ? prev : [...prev, membership]);

  const handleRemoveMember = async membershipId => {
    const res = await fetch(`/api/group-work/projects/${projectId}/members/${membershipId}/`, { method: "DELETE", headers: getAuthHeaders() });
    if (res.ok) setMembers(prev => prev.filter(i => i.id !== membershipId));
  };

  const handleDeleteProject = async () => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, { method: "DELETE", headers: getAuthHeaders() });
    if (!res.ok) return;
    window?.location ? window.location.assign("/group-work") : onBack();
  };

  return { project, loading, members, activeTab, setActiveTab, taskStats, setTaskStats, patchProject, handleMemberAdded, handleRemoveMember, handleDeleteProject };
}

export default function GroupProjectDetail({ projectId, onBack }) {
  const { project, loading, members, activeTab, setActiveTab, taskStats, setTaskStats, patchProject, handleMemberAdded, handleRemoveMember, handleDeleteProject } = useProjectDetail(projectId, onBack);

  if (loading) return <div><BackButton onClick={onBack} /><p>Loading project…</p></div>;
  if (!project) return <div><BackButton onClick={onBack} /><p>Project not found.</p></div>;

  return (
    <div>
      <div className={styles.topBar}>
        <BackButton onClick={onBack} />
        <button type="button" onClick={handleDeleteProject} className={styles.deleteProjectBtn}>Delete project</button>
      </div>
      <ProjectHeader project={project} members={members} onPatch={patchProject} taskStats={taskStats} />
      <MembersSection members={members} onRemove={handleRemoveMember} />
      <AddMemberForm projectId={projectId} onAdded={handleMemberAdded} />
      <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} projectId={projectId} members={members} onStatsUpdate={setTaskStats} />
    </div>
  );
}
