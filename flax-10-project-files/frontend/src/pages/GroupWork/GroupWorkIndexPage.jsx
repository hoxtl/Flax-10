import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupProjectDetail from "./GroupWorkDetail";
import {
  containerStyle,
  listStyle,
  rowStyle,
  metaStyle,
} from "./groupWorkStyles";
import {
  getAuthHeaders,
  useGroupProjects,
  useSelectedProjectId,
} from "./groupWorkHooks";

function CreateProjectForm({ onCreated }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    const body = JSON.stringify({
      name: name.trim(),
      course_code: courseCode.trim() || "",
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
    const res = await fetch("/api/group-work/projects/", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body,
    });
    if (!res.ok) return;
    const project = await res.json();
    onCreated(project);
    setName("");
    setCourseCode("");
    setDeadline("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginTop: 16,
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Group project name"
        style={{
          flex: 2,
          padding: "10px 12px",
          borderRadius: 999,
          border: "1px solid #e3d4c6",
          background: "#fffaf4",
          fontSize: 13,
        }}
        required
      />
      <input
        value={courseCode}
        onChange={(e) => setCourseCode(e.target.value)}
        placeholder="Course code (optional)"
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 999,
          border: "1px solid #e3d4c6",
          background: "#fffaf4",
          fontSize: 13,
        }}
      />
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 999,
          border: "1px solid #e3d4c6",
          background: "#fffaf4",
          fontSize: 13,
          color: "#3c2a20",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 18px",
          borderRadius: 999,
          border: "none",
          background: "#9b8b7c",
          color: "#fffaf4",
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Create
      </button>
    </form>
  );
}

export default function GroupWorkIndexPage() {
  const { projects, setProjects, loading } = useGroupProjects();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  const handleCreated = (project) => {
    setProjects((prev) => [project, ...prev]);
  };

  const openProject = (id) => {
    navigate(`/group-work?project=${id}`);
  };

  const title = "Group work";
  const subtitle = "Create shared projects and link them to your modules.";

  if (projectId) {
    return (
      <GroupProjectDetail
        projectId={projectId}
        onBack={() => navigate("/group-work")}
      />
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 24, margin: 0 }}>{title}</h1>
      <p style={metaStyle}>{subtitle}</p>
      <CreateProjectForm onCreated={handleCreated} />

      {loading && <p style={metaStyle}>Loading your group projects…</p>}

      {!loading && projects.length === 0 && (
        <p style={{ marginTop: 24, fontSize: 14, color: "#8f7969" }}>
          You do not have any group projects yet. Use the form above to create one.
        </p>
      )}

      {!loading && projects.length > 0 && (
        <div style={listStyle}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={rowStyle}
              onClick={() => openProject(project.id)}
            >
              <div>
                <div style={{ fontWeight: 500, color: "#3c2a20" }}>{project.name}</div>
                <div style={metaStyle}>
                  {project.course_code || "No course code"} ·{" "}
                  {(project.member_count ?? 0) === 1
                    ? "1 member"
                    : `${project.member_count ?? 0} members`}
                </div>
              </div>
              {project.deadline && (
                <div style={{ fontSize: 12, color: "#8f7969" }}>Due soon</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

