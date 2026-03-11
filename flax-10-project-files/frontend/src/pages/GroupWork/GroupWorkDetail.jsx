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

function ProjectProgress({ taskStats }) {
  return (
    <>
      <ProgressBar taskStats={taskStats} />
      <p>{taskStats.completed} / {taskStats.total} tasks complete · {taskStats.percent}% complete</p>
    </>
  );
}

function ProjectHeader({ project, members, onPatch, taskStats }) {
  const handleName = e => { const v = e.target.value.trim(); if (v && v !== project.name) onPatch({ name: v }); };
  const handleCourse = e => onPatch({ course_code: e.target.value.trim() });
  const handleDeadline = e => onPatch({ deadline: e.target.value ? new Date(e.target.value).toISOString() : null });
  const count = (project.member_count ?? members.length) || 0;
  return (
    <div className={styles.projectHeaderRow}>
      <div className={styles.projectLeft}>
        <input defaultValue={project.name} onBlur={handleName} className={styles.projectNameInput} />
        <p><input defaultValue={project.course_code || ""} placeholder="Course code" onBlur={handleCourse} className={styles.courseCodeInput} /> · {count} members</p>
        <ProjectProgress taskStats={taskStats} />
      </div>
      <div className={styles.deadlinePill}>
        <span>🗓</span>
        <input type="date" defaultValue={project.deadline?.slice(0, 10) ?? ""} onBlur={handleDeadline} className={styles.deadlineInput} />
      </div>
    </div>
  );
}

// ... existing MemberPill, MembersSection ...

function AddMemberForm({ projectId, onAdded }) {
  const [userId, setUserId] = useState("");
  const handleSubmit = async e => {
    e.preventDefault();
    if (!userId.trim()) return;
    const res = await fetch(`/api/group-work/projects/${projectId}/members/`, { method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ user: Number(userId), role: "member" }) });
    if (res.ok) { onAdded(await res.json()); setUserId(""); }
  };
  return (
    <form onSubmit={handleSubmit} className={styles.addMemberForm}>
      <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Add member by user ID" className={styles.addMemberInput} />
      <button type="submit" className={styles.addMemberBtn}>Add</button>
    </form>
  );
}

// ... existing TabsSection ...

function useProjectActions(projectId, setProject, setMembers, onBack) {
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
    if (res.ok) window?.location ? window.location.assign("/group-work") : onBack();
  };
  return { patchProject, handleRemoveMember, handleDeleteProject };
}

function useProjectDetail(projectId, onBack) {
  const { project, setProject, loading } = useProject(projectId);
  const { members, setMembers } = useProjectMembers(projectId);
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskStats, setTaskStats] = useState({ percent: 0, completed: 0, total: 0, segments: [] });
  const actions = useProjectActions(projectId, setProject, setMembers, onBack);

  const onAdded = m => setMembers(prev => prev.some(i => i.id === m.id) ? prev : [...prev, m]);

  return { project, loading, members, activeTab, setActiveTab, taskStats, setTaskStats, onAdded, ...actions };
}

export default function GroupProjectDetail({ projectId, onBack }) {
  const d = useProjectDetail(projectId, onBack);
  if (d.loading) return <div><BackButton onClick={onBack} /><p>Loading project…</p></div>;
  if (!d.project) return <div><BackButton onClick={onBack} /><p>Project not found.</p></div>;

  return (
    <div>
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
