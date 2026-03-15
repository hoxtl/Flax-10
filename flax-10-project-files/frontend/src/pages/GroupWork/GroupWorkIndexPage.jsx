import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupProjectDetail from "./GroupWorkDetail";
import { getAuthHeaders, useGroupProjects, useSelectedProjectId } from "./groupWorkHooks";
import { getDeadlineLabel } from "./utils/taskUtils";
import styles from "./GroupWorkIndexPage.module.css";

function CreateProjectInputs({ data, onChange }) {
  return (
    <>
      <input value={data.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Group project name" className={`${styles.input} ${styles.inputName}`} required />
      <input value={data.courseCode} onChange={(e) => onChange('courseCode', e.target.value)} placeholder="Course code (optional)" className={`${styles.input} ${styles.inputField}`} />
      <input type="date" value={data.deadline} onChange={(e) => onChange('deadline', e.target.value)} className={`${styles.input} ${styles.inputField}`} />
    </>
  );
}

function useCreateProject(onCreated) {
  const [form, setForm] = useState({ name: "", courseCode: "", deadline: "" });
  const change = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const body = JSON.stringify({ name: form.name.trim(), course_code: form.courseCode.trim() || "", deadline: form.deadline ? new Date(form.deadline).toISOString() : null });
    const res = await fetch("/api/group-work/projects/", { method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body });
    if (res.ok) { onCreated(await res.json()); setForm({ name: "", courseCode: "", deadline: "" }); }
  };
  return { form, change, submit };
}

function CreateProjectForm({ onCreated }) {
  const { form, change, submit } = useCreateProject(onCreated);
  return (
    <form onSubmit={submit} className={styles.createProjectForm}>
      <CreateProjectInputs data={form} onChange={change} />
      <button type="submit" className={styles.submitBtn}>Create</button>
    </form>
  );
}

function ProjectRow({ project, onClick }) {
  return (
    <div className={styles.projectRow} onClick={onClick}>
      <span className={styles.projectName}>{project.name}</span>
      <span className={styles.projectDeadline}>{getDeadlineLabel(project.deadline)}</span>
    </div>
  );
}

function GroupWorkContent({ projects, loading, projectListProps }) {
  if (loading) return <p className={styles.loading}>Loading your group projects…</p>;
  if (projects.length === 0) return <p className={styles.emptyMessage}>You do not have any group projects yet. Use the form above to create one.</p>;
  return (
    <div className={styles.projectList}>
      {projects.map((p) => <ProjectRow key={p.id} project={p} {...projectListProps(p)} />)}
    </div>
  );
}

function GroupWorkHeader() {
  return (
    <>
      <h1 className={styles.title}>Group work</h1>
      <p className={styles.subtitle}>Create shared projects and link them to your modules.</p>
    </>
  );
}

export default function GroupWorkIndexPage() {
  const { projects, setProjects, loading } = useGroupProjects();
  const navigate = useNavigate();
  const pid = useSelectedProjectId();
  if (pid) return <GroupProjectDetail projectId={pid} onBack={() => navigate("/group-work")} />;
  const onCreated = (p) => setProjects((prev) => [p, ...prev]);
  return (
    <div className={styles.container}>
      <GroupWorkHeader />
      <CreateProjectForm onCreated={onCreated} />
      <GroupWorkContent projects={projects} loading={loading} projectListProps={(p) => ({ onClick: () => navigate(`/group-work?project=${p.id}`) })} />
    </div>
  );
}
