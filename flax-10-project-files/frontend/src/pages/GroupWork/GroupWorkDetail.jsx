import { useState, useRef } from "react";
import {
  containerStyle,
  detailTabsRowStyle,
  detailTabStyle,
  detailCardStyle,
  metaStyle,
} from "./groupWorkStyles";
import {
  getAuthHeaders,
  useProject,
  useProjectMembers,
} from "./groupWorkHooks";
import GroupTasksTab from "./GroupTasksTab";
import AvailabilityTab from "./AvailabilityTab";
import { getUserColor } from "./components/TaskAssigneePopup";

function BackButton({ onClick }) {
  const style = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "none",
    background: "var(--hover)",
    color: "var(--text)",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
    transition: "all 0.2s ease",
  };
  return (
    <button type="button" onClick={onClick} style={style}>
      <span style={{ fontSize: 14 }}>←</span>
      <span>Back to all projects</span>
    </button>
  );
}

function AddMemberForm({ projectId, onAdded }) {
  const [userId, setUserId] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!userId.trim()) return;
    const body = JSON.stringify({ user: Number(userId), role: "member" });
    const res = await fetch(`/api/group-work/projects/${projectId}/members/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body,
    });
    if (!res.ok) return;
    const membership = await res.json();
    onAdded(membership);
    setUserId("");
  };

  const inputStyle = {
    flex: 1,
    padding: "9px 12px",
    borderRadius: 999,
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: 13,
  };
  const buttonStyle = {
    padding: "9px 16px",
    borderRadius: 999,
    border: "none",
    background: "var(--primary)",
    color: "white",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginTop: 8,
      }}
    >
      <input
        value={userId}
        onChange={(event) => setUserId(event.target.value)}
        placeholder="Add member by user ID"
        style={inputStyle}
      />
      <button type="submit" style={buttonStyle}>
        Add
      </button>
    </form>
  );
}

function MembersSection({ members, onRemove }) {
  const pillStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
    borderRadius: 999,
    background: "var(--hover)",
    color: "var(--text)",
    fontSize: 12,
    fontWeight: 500,
  };
  const avatarStyle = {
    width: 24,
    height: 24,
    borderRadius: "999px",
    background: "var(--primary)",
    color: "white",
    fontSize: 11,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
  };
  const removeStyle = {
    marginLeft: 8,
    fontSize: 11,
    border: "none",
    background: "transparent",
    color: "var(--danger)",
    cursor: "pointer",
  };

  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>Members</h2>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {members.map((member) => (
          <div key={member.id} style={pillStyle}>
            <span style={avatarStyle}>
              {(member.user_name || "?").slice(0, 2).toUpperCase()}
            </span>
            <span>{member.user_name}</span>
            {member.role !== "owner" && (
              <button
                type="button"
                onClick={() => onRemove(member.id)}
                style={removeStyle}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p style={metaStyle}>No members yet. Add your first member below.</p>
        )}
      </div>
    </section>
  );
}

function ProjectHeader({ project, members, onPatch, taskStats }) {
  const [hoveredSeg, setHoveredSeg] = useState(null);
  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  };
  const progressBarOuter = {
    height: 12,
    borderRadius: 6,
    background: "var(--border)",
    overflow: "visible",
    display: "flex",
    marginBottom: 4,
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.1)",
    position: "relative",
  };
  const progressBarInner = {
    display: "flex",
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    height: "100%",
  };
  const progressBarSegment = {
    height: "100%",
    transition: "all 0.3s ease",
    cursor: "pointer",
    position: "relative",
  };
  const deadlinePill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
    borderRadius: 999,
    background: "var(--hover)",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
  };

  const handleNameBlur = (event) => {
    const value = event.target.value.trim();
    if (value && value !== project.name) onPatch({ name: value });
  };

  const handleCourseBlur = (event) => {
    const value = event.target.value.trim();
    onPatch({ course_code: value });
  };

  const handleDeadlineBlur = (event) => {
    const value = event.target.value;
    const deadline = value ? new Date(value).toISOString() : null;
    onPatch({ deadline });
  };

  return (
    <section style={{ marginTop: 12 }}>
      <div style={headerStyle}>
        <div style={{ flex: 1 }}>
          <input
            defaultValue={project.name}
            onBlur={handleNameBlur}
            style={{
              fontSize: 24,
              margin: "0 0 4px",
              border: "none",
              background: "transparent",
              fontWeight: 600,
              color: "var(--text)",
            }}
          />
          <p style={metaStyle}>
            <input
              defaultValue={project.course_code || ""}
              placeholder="Course code"
              onBlur={handleCourseBlur}
              style={{
                border: "none",
                background: "transparent",
                fontSize: 13,
                color: "var(--text-secondary)",
                padding: 0,
                marginRight: 4,
              }}
            />
            · {(project.member_count ?? members.length) || 0} members
          </p>
          <div style={{ marginTop: 8 }}>
            <div style={progressBarOuter}>
              <div style={progressBarInner}>
                {taskStats.segments && taskStats.segments.map((seg, idx) => (
                  <div
                    key={seg.id ?? idx}
                    style={{
                      ...progressBarSegment,
                      width: `${seg.percentage}%`,
                      background: seg.id === 'unassigned' ? '#c0b8b0' : getUserColor(seg.id),
                      opacity: hoveredSeg && hoveredSeg !== (seg.id ?? idx) ? 0.65 : 1,
                    }}
                    onMouseEnter={() => setHoveredSeg(seg.id ?? idx)}
                    onMouseLeave={() => setHoveredSeg(null)}
                  />
                ))}
              </div>
              {hoveredSeg !== null && taskStats.segments && (() => {
                const seg = taskStats.segments.find(s => (s.id ?? s.name) === hoveredSeg) ||
                  taskStats.segments[hoveredSeg];
                if (!seg) return null;
                return (
                  <div style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--card-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text)",
                    whiteSpace: "nowrap",
                    boxShadow: "var(--shadow-md)",
                    zIndex: 100,
                    pointerEvents: "none",
                  }}>
                    <span style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: seg.id === 'unassigned' ? '#c0b8b0' : getUserColor(seg.id),
                      marginRight: 6,
                      verticalAlign: "middle"
                    }} />
                    {seg.tooltip || seg.name}
                  </div>
                );
              })()}
            </div>
            <p style={metaStyle}>{taskStats.completed} / {taskStats.total} tasks complete · {taskStats.percent}% complete</p>
          </div>
        </div>
        <div style={deadlinePill}>
          <span role="img" aria-label="calendar">
            🗓
          </span>
          <input
            type="date"
            defaultValue={project.deadline ? project.deadline.slice(0, 10) : ""}
            onBlur={handleDeadlineBlur}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 12,
              color: "var(--primary)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function TabsSection({ activeTab, setActiveTab, projectId, members, onStatsUpdate }) {
  return (
    <section style={{ marginTop: 24 }}>
      <div style={detailTabsRowStyle}>
        <button
          type="button"
          style={detailTabStyle(activeTab === "tasks")}
          onClick={() => setActiveTab("tasks")}
        >
          Tasks
        </button>
        <button
          type="button"
          style={detailTabStyle(activeTab === "availability")}
          onClick={() => setActiveTab("availability")}
        >
          Availability
        </button>
      </div>
      {activeTab === "tasks" && (
        <GroupTasksTab projectId={projectId} members={members} onStatsUpdate={onStatsUpdate} />
      )}
      {activeTab === "availability" && (
        <AvailabilityTab projectId={projectId} />
      )}
    </section>
  );
}

export default function GroupProjectDetail({ projectId, onBack }) {
  const { project, setProject, loading } = useProject(projectId);
  const { members, setMembers } = useProjectMembers(projectId);
  const [activeTab, setActiveTab] = useState("tasks");
  const [taskStats, setTaskStats] = useState({ percent: 0, completed: 0, total: 0, segments: [] });

  const patchProject = async (partial) => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(partial),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setProject(updated);
  };

  const handleMemberAdded = (membership) => {
    setMembers((prev) => {
      const exists = prev.some((item) => item.id === membership.id);
      return exists ? prev : [...prev, membership];
    });
  };

  const handleRemoveMember = async (membershipId) => {
    const url = `/api/group-work/projects/${projectId}/members/${membershipId}/`;
    const res = await fetch(url, { method: "DELETE", headers: getAuthHeaders() });
    if (!res.ok) return;
    setMembers((prev) => prev.filter((item) => item.id !== membershipId));
  };

  const handleDeleteProject = async () => {
    const res = await fetch(`/api/group-work/projects/${projectId}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) return;
    if (window && window.location) {
      window.location.assign("/group-work");
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <BackButton onClick={onBack} />
        <p style={metaStyle}>Loading project…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={containerStyle}>
        <BackButton onClick={onBack} />
        <p style={metaStyle}>Project not found.</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <BackButton onClick={onBack} />
        <button
          type="button"
          onClick={handleDeleteProject}
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            border: "none",
            background: "var(--danger-bg)",
            color: "var(--danger)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Delete project
        </button>
      </div>
      <ProjectHeader
        project={project}
        members={members}
        onPatch={patchProject}
        taskStats={taskStats}
      />
      <MembersSection members={members} onRemove={handleRemoveMember} />
      <AddMemberForm projectId={projectId} onAdded={handleMemberAdded} />
      <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} projectId={projectId} members={members} onStatsUpdate={setTaskStats} />
    </div>
  );
}

