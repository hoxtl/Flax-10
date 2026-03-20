import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./GroupWorkIndexPage.module.css";
import { useGroupProjects, useSelectedProjectId } from "./groupWorkHooks";
import GroupProjectDetail from "./GroupWorkDetail";
import AppPage from "../../components/common/AppPage/AppPage";
import GroupWorkStats from "./components/GroupWorkStats";
import GroupWorkIndexSkeleton from "./components/GroupWorkIndexSkeleton";
import CreateProjectForm from "./components/CreateProjectForm";
import GroupWorkContent from "./components/GroupWorkContent";

export default function GroupWorkIndexPage() {
  const { projects, setProjects, loading } = useGroupProjects();
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const pid = useSelectedProjectId();

  if (pid) {
    return (
      <GroupProjectDetail 
        projectId={pid} 
        onBack={() => navigate("/group-work")} 
        onDelete={(id) => setProjects(prev => prev.filter(p => String(p.id) !== String(id)))}
        onUpdate={(upd) => setProjects(prev => prev.map(p => String(p.id) === String(upd.id) ? { ...p, ...upd } : p))}
      />
    );
  }

  if (loading) return <GroupWorkIndexSkeleton />;

  const onCreated = (p) => setProjects((prev) => [p, ...prev]);

  return (
    <AppPage 
        className={styles.container} 
        title="Group work" 
        subtitle="Create shared projects and link them to your modules."
    >
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
