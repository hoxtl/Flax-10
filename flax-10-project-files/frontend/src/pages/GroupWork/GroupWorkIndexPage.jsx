import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GroupWorkIndexPage.module.css";
import { useGroupProjects, useSelectedProjectId } from "./groupWorkHooks";
import GroupProjectDetail from "./GroupWorkDetail";
import AppPage from "../../components/common/AppPage/AppPage";
import Card from "../../components/common/Card/Card";
import FormField from "../../components/common/FormField/FormField";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import PrimaryButton from "../../components/common/PrimaryButton/PrimaryButton";
import GroupWorkStats from "./components/GroupWorkStats";
import TextInput from "../../components/common/TextInput/TextInput";
import UserModuleDropdown from "../../components/Modules/UserModuleDropdown";

function GroupWorkIndexSkeleton() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonStats}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className={styles.skeletonStatCard} height="100px" />
        ))}
      </div>
      <SkeletonBlock className={styles.skeletonForm} height="200px" />
      <div className={styles.skeletonList}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} className={styles.skeletonRow} height="80px" />
        ))}
      </div>
    </div>
  );
}

function CreateProjectInputs({ data, onChange }) {
  return (
    <>
      <FormField label="Project Name" className={styles.inputName}>
        <TextInput 
          value={data.name} 
          onChange={(e) => onChange('name', e.target.value)} 
          placeholder="e.g. Machine Learning Research..." 
          required 
        />
      </FormField>
      <FormField label={<>Module <span className={styles.optionalText}>(Optional)</span></>} className={styles.inputField}>
        <UserModuleDropdown
          value={data.course_code}
          onChange={(val) => onChange('course_code', val)}
          placeholder="Select..."
        />
      </FormField>
      <FormField label="Deadline" className={styles.inputField}>
        <TextInput 
          type="date" 
          value={data.deadline} 
          onChange={(e) => onChange('deadline', e.target.value)} 
        />
      </FormField>
    </>
  );
}

function CreateProjectForm({ onCreated }) {
  const [form, setForm] = useState({ name: "", course_code: "", deadline: "" });
  const change = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  
  const submit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const res = await fetch("/api/group-work/projects/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      onCreated(await res.json());
      setForm({ name: "", course_code: "", deadline: "" });
    }
  };

  return (
    <Card className={styles.formCard} padding="sm">
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

const THEMES = [
  { pill: styles.daysGreen, ring: "#22c55e" },
  { pill: styles.daysYellow, ring: "#eab308" },
  { pill: styles.daysBlue, ring: "#3b82f6" },
  { pill: styles.daysPurple, ring: "#a855f7" },
  { pill: styles.daysOrange, ring: "#f97316" },
];

function getProjectTheme(id) {
  const hash = id ? String(id).split("").reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  return THEMES[hash % THEMES.length];
}

function getMockAvatars(projectId, memberCount) {
  const hash = projectId ? String(projectId).split("").reduce((a, b) => a + b.charCodeAt(0), 0) : 0;
  const pool = ["AL", "BE", "CF", "DK", "EM", "FN", "GO", "HP", "IQ", "JR"];
  if (!memberCount) return { avatars: [], remaining: 0 };
  const count = Math.min(memberCount, 3);
  const avatars = [];
  for (let i = 0; i < count; i++) avatars.push(pool[(hash + i) % pool.length]);
  return { avatars, remaining: memberCount > 3 ? memberCount - 3 : 0 };
}

function ProjectRow({ project, onClick }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const dateObj = project.deadline ? new Date(project.deadline) : null;
  const dateString = dateObj ? dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' }) : "--";
  const diffTime = dateObj ? (dateObj - new Date()) : 0;
  const daysLeft = dateObj ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) : null;

  const theme = getProjectTheme(project.id);
  const totalTasks = project.task_count || 0;
  const completedTasks = project.completed_task_count || 0;
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const mockMem = getMockAvatars(project.id, project.member_count);
  
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={styles.projectRowContainer}>
      <div className={styles.projectRow} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.projectInfoArea}>
            <div className={styles.projectIcon}>
                {project.name ? project.name.charAt(0).toUpperCase() : "P"}
            </div>
            <div className={styles.projectText}>
                <div className={styles.projectName}>{project.name}</div>
                <div className={styles.projectSub}>
                    <div className={styles.avatarStack}>
                        {mockMem.avatars.map((ini, i) => (
                            <div key={i} className={styles.avatarPill} style={{ zIndex: 10 - i }}>{ini}</div>
                        ))}
                        {mockMem.remaining > 0 && (
                            <div className={styles.avatarPill} style={{ zIndex: 1 }}>+{mockMem.remaining}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className={styles.projectMetaArea}>
            <div className={styles.deadlineInfo}>
                <div className={styles.deadlineDate}>{dateString}</div>
                {daysLeft !== null && (
                    <div className={`${styles.daysPill} ${theme.pill}`}>
                        {daysLeft < 0 ? 'Past due' : `${daysLeft} days`}
                    </div>
                )}
            </div>
            <div className={styles.progressCircleContainer}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r={radius} stroke="var(--border)" strokeWidth="3" fill="none" />
                  <circle cx="12" cy="12" r={radius} stroke={theme.ring} strokeWidth="3" fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform="rotate(-90 12 12)" />
                </svg>
            </div>
            <div className={isExpanded ? styles.arrowIconUp : styles.arrowIcon}>↓</div>
        </div>
      </div>
      
      {isExpanded && (
          <div className={styles.projectAccordion}>
              <div className={styles.accordionStats}>
                  <div className={styles.statBlock}>
                      <span className={styles.statLabel}>COMPLETION</span>
                      <span className={styles.statValue}>{percent}%</span>
                  </div>
                  <div className={styles.statBlock}>
                      <span className={styles.statLabel}>MEMBERS</span>
                      <span className={styles.statValue}>{project.member_count || 1}</span>
                  </div>
                  <div className={styles.statBlock}>
                      <span className={styles.statLabel}>TASKS DONE</span>
                      <span className={styles.statValue}>{completedTasks}/{totalTasks}</span>
                  </div>
              </div>
              <div className={styles.accordionActions}>
                  <button className={styles.btnOpen} onClick={(e) => { e.stopPropagation(); onClick(); }}>Open project →</button>
                  <button className={styles.btnSecondary} onClick={(e) => { e.stopPropagation(); }}>Invite member</button>
                  <button className={styles.btnSecondary} onClick={(e) => { e.stopPropagation(); }}>Edit details</button>
              </div>
          </div>
      )}
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
