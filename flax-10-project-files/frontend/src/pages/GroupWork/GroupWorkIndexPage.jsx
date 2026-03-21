/*
 * GroupWork index page.
 */

import { useState } from "react";
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
  const projectId = useSelectedProjectId();
  return projectId ? <ProjectDetailRoute projectId={projectId} /> : <GroupWorkOverview />;
}

function ProjectDetailRoute({ projectId }) {
  const navigate = useNavigate();
  const goBack = () => navigate("/group-work", { replace: true });
  return <GroupProjectDetail projectId={projectId} onBack={goBack} onDelete={goBack} onUpdate={undefined} />;
}

function GroupWorkOverview() {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const data = useGroupProjects();
  if (data.loading) return <GroupWorkIndexSkeleton />;
  return (
    <AppPage className={styles.container} title="Group work" subtitle="Create shared projects and link them to your modules.">
      <GroupWorkStats projects={data.projects} />
      <CreateProjectForm onCreated={(project) => prependProject(project, data.setProjects)} />
      <GroupWorkContent projects={data.projects} projectListProps={(project) => ({ onClick: () => navigate(`/group-work?project=${project.id}`) })} filter={filter} setFilter={setFilter} />
    </AppPage>
  );
}

function prependProject(project, setProjects) {
  setProjects((prev) => [project, ...prev]);
}
