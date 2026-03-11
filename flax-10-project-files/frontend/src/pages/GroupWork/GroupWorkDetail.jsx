import { useState } from "react";
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

function BackButton({ onClick }) {
  const style = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "none",
    background: "#f3e4d7",
    color: "#3c2a20",
    fontSize: 13,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
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
    border: "1px solid #e3d4c6",
    background: "#fffaf4",
    fontSize: 13,
  };
  const buttonStyle = {
    padding: "9px 16px",
    borderRadius: 999,
    border: "none",
    background: "#9b8b7c",
    color: "#fffaf4",
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
    background: "#f7efe7",
    color: "#3c2a20",
    fontSize: 12,
    fontWeight: 500,
  };
  const avatarStyle = {
    width: 24,
    height: 24,
    borderRadius: "999px",
    background: "#3f2a20",
    color: "#fff8f1",
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
    color: "#b85c5c",
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

function ProjectHeader({ project, members, onPatch }) {
  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  };
  const progressBarOuter = {
    height: 8,
    borderRadius: 999,
    background: "#f3e4d7",
    overflow: "hidden",
    marginBottom: 4,
  };
  const progressBarInner = {
    width: "0%",
    height: "100%",
    borderRadius: 999,
    background: "#5b3b2a",
  };
  const deadlinePill = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
    borderRadius: 999,
    background: "#f3e4d7",
    fontSize: 12,
    fontWeight: 500,
    color: "#7b4b2b",
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
              color: "#3c2a20",
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
                color: "#8f7969",
                padding: 0,
                marginRight: 4,
              }}
            />
            · {(project.member_count ?? members.length) || 0} members
          </p>
          <div style={{ marginTop: 8 }}>
            <div style={progressBarOuter}>
              <div style={progressBarInner} />
            </div>
            <p style={metaStyle}>0 / 0 tasks complete · 0% complete</p>
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
              color: "#7b4b2b",
            }}
          />
        </div>
      </div>
    </section>
  );
}

function TabsSection({ activeTab, setActiveTab }) {
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
        <div style={detailCardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) 80px 110px 90px",
              fontSize: 12,
              color: "#9a8474",
              marginBottom: 8,
            }}
          >
            <span>Task</span>
            <span>Priority</span>
            <span>Owner</span>
            <span>Due</span>
          </div>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #f0dfd1",
              background: "#fffaf4",
              padding: "10px 12px",
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) 80px 110px 90px",
              alignItems: "center",
              fontSize: 13,
              color: "#3c2a20",
            }}
          >
            <span>No tasks yet for this project.</span>
            <span style={{ fontSize: 11, color: "#c9a790" }}>–</span>
            <span style={{ fontSize: 11, color: "#c9a790" }}>–</span>
            <span style={{ fontSize: 11, color: "#c9a790" }}>–</span>
          </div>
          <p style={{ ...metaStyle, marginTop: 10 }}>
            Your group can add and track project tasks here once tasks are
            linked.
          </p>
        </div>
      )}
      {activeTab === "availability" && (
        <div style={detailCardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.6fr) 1fr",
              fontSize: 12,
              color: "#9a8474",
              marginBottom: 8,
            }}
          >
            <span>Best times to meet</span>
            <span style={{ textAlign: "right" }}>Everyone free</span>
          </div>
          <div
            style={{
              borderRadius: 12,
              border: "1px solid #f0dfd1",
              background: "#fffaf4",
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              fontSize: 13,
              color: "#3c2a20",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Availability not set up yet.</span>
              <span style={{ fontSize: 11, color: "#c9a790" }}>– / – free</span>
            </div>
            <p style={{ ...metaStyle, margin: 0 }}>
              Suggested meeting slots for this group will appear here once
              calendar data is connected.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default function GroupProjectDetail({ projectId, onBack }) {
  const { project, setProject, loading } = useProject(projectId);
  const { members, setMembers } = useProjectMembers(projectId);
  const [activeTab, setActiveTab] = useState("tasks");

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
            background: "#f7e1df",
            color: "#8c3b32",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Delete project
        </button>
      </div>
      <ProjectHeader
        project={project}
        members={members}
        onPatch={patchProject}
      />
      <MembersSection members={members} onRemove={handleRemoveMember} />
      <AddMemberForm projectId={projectId} onAdded={handleMemberAdded} />
      <TabsSection activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

