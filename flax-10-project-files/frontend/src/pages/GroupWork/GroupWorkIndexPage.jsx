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
import UserModuleDropdown from "../../components/Modules/UserModuleDropdown";
import GroupWorkStats from "./components/GroupWorkStats";
import styles from "./GroupWorkIndexPage.module.css";

function GroupWorkIndexSkeleton() {
  return (
    <AppPage className={styles.container} data-testid="groupwork-skeleton" aria-busy="true" title="Group work" subtitle="Create shared projects and link them to your modules.">
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
        <TextInput value={data.name} onChange={(e) => onChange('name', e.target.value)} placeholder="e.g. Machine Learning Research..." required />
      </FormField>
      <FormField label={<>Module <span className={styles.optionalText}>optional</span></>} className={styles.inputField}>
        <UserModuleDropdown
          value={data.courseCode}
          onChange={(val) => onChange('courseCode', val)}
          placeholder="Select..."
        />
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
    <Card className={styles.createProjectCard} padding="lg">
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>NEW PROJECT</h3>
        <div className={styles.sectionLine} />
      </div>
      <form onSubmit={submit} className={styles.createProjectForm}>
        <CreateProjectInputs data={form} onChange={change} />
        <div className={styles.formFooter}>
          <PrimaryButton type="submit" className={styles.submitBtn} pill>+ Create project</PrimaryButton>
        </div>
      </form>
    </Card>
  );
}

function ProjectRow({ project, onClick }) {
  const dateObj = project.deadline ? new Date(project.deadline) : null;
  const dateString = dateObj ? dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "--";
  const diffTime = dateObj ? (dateObj - new Date()) : 0;
  const daysLeft = dateObj ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className={styles.projectRow} onClick={onClick}>
      <div className={styles.projectInfoArea}>
        <div className={styles.projectIcon}>
          {project.name ? project.name.charAt(0).toUpperCase() : "P"}
        </div>
        <div className={styles.projectText}>
          <div className={styles.projectName}>{project.name}</div>
          <div className={styles.projectSub}>
            <span className={styles.moduleName}>{project.course_code || "No module"}</span>
            {!!project.member_count && (
               <span className={styles.memberPill}>+{project.member_count}</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.projectMetaArea}>
        <div className={styles.deadlineInfo}>
           <div className={styles.deadlineDate}>{dateString}</div>
           {daysLeft !== null && (
               <div className={`${styles.daysPill} ${daysLeft < 0 ? styles.daysRed : daysLeft < 7 ? styles.daysYellow : styles.daysGreen}`}>
                 {daysLeft < 0 ? 'Past due' : `${daysLeft} days`}
               </div>
           )}
        </div>
        <div className={styles.progressCircle}></div>
        <div className={styles.arrowIcon}>↓</div>
      </div>
    </div>
  );
}

function GroupWorkContent({ projects, projectListProps, filter, setFilter }) {
  const filteredProjects = projects.filter(p => {
    if (filter === "all") return true;
    if (filter === "due_soon") {
      const days = p.deadline ? Math.ceil((new Date(p.deadline) - Date.now()) / (1000 * 60 * 60 * 24)) : Infinity;
      return days > 0 && days <= 30;
    }
    if (filter === "later") {
      const days = p.deadline ? Math.ceil((new Date(p.deadline) - Date.now()) / (1000 * 60 * 60 * 24)) : Infinity;
      return days > 30 || days === Infinity;
    }
    return true;
  });

  return (
    <div className={styles.projectsSection}>
      <div className={styles.projectsHeader}>
        <h3 className={styles.sectionTitle}>PROJECTS</h3>
        <div className={styles.filterTabs}>
          <button className={`${styles.filterTab} ${filter === "all" ? styles.filterTabActive : ""}`} onClick={() => setFilter("all")}>All</button>
          <button className={`${styles.filterTab} ${filter === "due_soon" ? styles.filterTabActive : ""}`} onClick={() => setFilter("due_soon")}>Due soon</button>
          <button className={`${styles.filterTab} ${filter === "later" ? styles.filterTabActive : ""}`} onClick={() => setFilter("later")}>Later</button>
        </div>
      </div>
      {filteredProjects.length === 0 ? (
        <p className={styles.emptyMessage}>No projects match this filter.</p>
      ) : (
        <div className={styles.projectList}>
          {filteredProjects.map((p) => <ProjectRow key={p.id} project={p} {...projectListProps(p)} />)}
        </div>
      )}
    </div>
  );
}

export default function GroupWorkIndexPage() {
  const { projects, setProjects, loading } = useGroupProjects();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const pid = useSelectedProjectId();
  if (pid) return <GroupProjectDetail projectId={pid} onBack={() => navigate("/group-work")} onDelete={(id) => setProjects(prev => prev.filter(p => String(p.id) !== String(id)))} />;
  if (loading) return <GroupWorkIndexSkeleton />;
  const onCreated = (p) => setProjects((prev) => [p, ...prev]);
  return (
    <AppPage className={styles.container} title="Group work" subtitle="Create shared projects and link them to your modules.">
      <GroupWorkStats projects={projects} />
      <CreateProjectForm onCreated={onCreated} />
      <GroupWorkContent 
        projects={projects} 
        projectListProps={(p) => ({ onClick: () => navigate(`/group-work?project=${p.id}`) })} 
        filter={filter}
        setFilter={setFilter}
      />
    </AppPage>
  );
}
