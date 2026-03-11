import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupProjectDetail from "./GroupWorkDetail";
import { getAuthHeaders, useGroupProjects, useSelectedProjectId } from "./groupWorkHooks";
import { getDeadlineLabel } from "./utils/taskUtils";
import styles from "./GroupWorkIndexPage.module.css";

function CreateProjectForm({ onCreated }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    const res = await fetch("/api/group-work/projects/", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        name: name.trim(),
        course_code: courseCode.trim() || "",
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    });
    if (!res.ok) return;
    onCreated(await res.json());
    setName(""); setCourseCode(""); setDeadline("");
  };

  return (
    <form onSubmit={handleSubmit} className={styles.createProjectForm}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group project name" className={`${styles.input} ${styles.inputName}`} required />
      <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="Course code (optional)" className={`${styles.input} ${styles.inputField}`} />
      <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={`${styles.input} ${styles.inputField}`} />
      <button type="submit" className={styles.submitBtn}>Create</button>
    </form>
  );
}

function ProjectRow({ project, onClick }) {
  const deadlineLabel = getDeadlineLabel(project.deadline);
  return (
    <div className={styles.projectRow} onClick={onClick}>
      <div>
        <div className={styles.projectName}>{project.name}</div>
        <div className={styles.subtitle}>
          {project.course_code || "No course code"} ·{" "}
          {(project.member_count ?? 0) === 1 ? "1 member" : `${project.member_count ?? 0} members`}
        </div>
      </div>
      {deadlineLabel && <div className={styles.projectDeadline}>{deadlineLabel}</div>}
    </div>
  );
}

export default function GroupWorkIndexPage() {
  const { projects, setProjects, loading } = useGroupProjects();
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  if (projectId) {
    return <GroupProjectDetail projectId={projectId} onBack={() => navigate("/group-work")} />;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Group work</h1>
      <p className={styles.subtitle}>Create shared projects and link them to your modules.</p>
      <CreateProjectForm onCreated={(p) => setProjects((prev) => [p, ...prev])} />

      {loading && <p className={styles.loading}>Loading your group projects…</p>}
      {!loading && projects.length === 0 && (
        <p className={styles.emptyMessage}>You do not have any group projects yet. Use the form above to create one.</p>
      )}
      {!loading && projects.length > 0 && (
        <div className={styles.projectList}>
          {projects.map((p) => (
            <ProjectRow key={p.id} project={p} onClick={() => navigate(`/group-work?project=${p.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
