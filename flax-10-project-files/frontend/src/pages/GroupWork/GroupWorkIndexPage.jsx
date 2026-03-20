import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GroupProjectDetail from "./GroupWorkDetail";
import { getAuthHeaders, useGroupProjects, useSelectedProjectId } from "./groupWorkHooks";
import { getDeadlineLabel } from "./utils/taskUtils";
import AppPage from "../../components/common/AppPage/AppPage";
import Card from "../../components/common/Card/Card";
import FormField from "../../components/common/FormField/FormField";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import TextInput from "../../components/common/TextInput/TextInput";
import styles from "./GroupWorkIndexPage.module.css";

const groupStudySubtitle = (
  <>
    Plan <em>shared projects</em>, <em>group deadlines</em>, and <em>module teamwork</em> in one place.
  </>
);

function GroupWorkIndexSkeleton() {
  return (
    <AppPage className={styles.container} data-testid="groupwork-skeleton" aria-busy="true" title="Group Study" subtitle={groupStudySubtitle}>
      <div className={styles.skeletonHeader}>
        <SkeletonBlock className={styles.skeletonTitle} />
        <SkeletonBlock className={styles.skeletonSubtitle} />
      </div>
      <div className={styles.skeletonForm}>
        <SkeletonBlock className={`${styles.skeletonInput} ${styles.skeletonInputName}`} />
        <SkeletonBlock className={styles.skeletonInput} />
        <SkeletonBlock className={styles.skeletonInput} />
        <SkeletonBlock className={styles.skeletonButton} />
      </div>
      <div className={styles.skeletonList}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.skeletonRow}>
            <SkeletonBlock className={styles.skeletonRowName} />
            <SkeletonBlock className={styles.skeletonRowMeta} />
          </div>
        ))}
      </div>
    </AppPage>
  );
}

function CreateProjectInputs({ data, onChange }) {
  return (
    <>
      <FormField label="Project name" className={styles.inputName}>
        <TextInput value={data.name} onChange={(e) => onChange('name', e.target.value)} placeholder="Group project name" required />
      </FormField>
      <FormField label="Course code" hint="Optional" className={styles.inputField}>
        <TextInput value={data.courseCode} onChange={(e) => onChange('courseCode', e.target.value)} placeholder="Course code" />
      </FormField>
      <FormField label="Deadline" className={styles.inputField}>
        <TextInput type="date" value={data.deadline} onChange={(e) => onChange('deadline', e.target.value)} />
      </FormField>
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
    <Card as="form" onSubmit={submit} className={styles.createProjectForm} padding="lg">
      <CreateProjectInputs data={form} onChange={change} />
      <div className={styles.submitField}>
        <span className={styles.submitLabel} aria-hidden>Create project</span>
        <div className={styles.submitWrap}>
          <PrimaryButton type="submit" className={styles.submitBtn} pill>Create</PrimaryButton>
        </div>
      </div>
    </Card>
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

function GroupWorkContent({ projects, projectListProps }) {
  if (projects.length === 0) return <p className={styles.emptyMessage}>You do not have any group projects yet. Use the form above to create one.</p>;
  return (
    <Card className={styles.projectList} padding="sm">
      {projects.map((p) => <ProjectRow key={p.id} project={p} {...projectListProps(p)} />)}
    </Card>
  );
}

export default function GroupWorkIndexPage() {
  const { projects, setProjects, loading } = useGroupProjects();
  const navigate = useNavigate();
  const pid = useSelectedProjectId();
  if (pid) return <GroupProjectDetail projectId={pid} onBack={() => navigate("/group-work")} />;
  if (loading) return <GroupWorkIndexSkeleton />;
  const onCreated = (p) => setProjects((prev) => [p, ...prev]);
  return (
    <AppPage className={styles.container} title="Group Study" subtitle={groupStudySubtitle}>
      <CreateProjectForm onCreated={onCreated} />
      <GroupWorkContent projects={projects} projectListProps={(p) => ({ onClick: () => navigate(`/group-work?project=${p.id}`) })} />
    </AppPage>
  );
}
