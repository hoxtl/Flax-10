/*
 * GroupWork index page.
 */

import { useNavigate } from "react-router-dom";
import styles from "./GroupWorkIndexPage.module.css";
import { useGroupProjects, useGroupProjectSort, useSelectedProjectId } from "./groupWorkHooks";
import GroupProjectDetail from "./GroupWorkDetail";
import AppPage from "../../components/common/AppPage/AppPage";
import { BackToTop } from "../../components/Pagination/Pagination";
import GroupWorkStats from "./components/GroupWorkStats";
import GroupWorkIndexSkeleton from "./components/GroupWorkIndexSkeleton";
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

function GroupWorkPageSubtitle() {
    return <>Keep <em>shared project work</em>, <em>module context</em>, <em>team planning</em>, and <em>deadlines</em> in one calm place.</>;
}

function GroupWorkOverviewContent({ data, sorting, navigate }) {
    return (
        <>
            <GroupWorkStats projects={data.projects} />
            <GroupWorkContent
                projects={data.projects}
                projectListProps={(project) => ({ onClick: () => navigate(`/group-work?project=${project.id}`) })}
                sortBy={sorting.sortBy}
                setSortBy={sorting.setSortBy}
                onProjectCreated={(project) => prependProject(project, data.setProjects)}
            />
        </>
    );
}

function GroupWorkOverview() {
    const navigate = useNavigate();
    const data = useGroupProjects();
    const sorting = useGroupProjectSort();
    return (
        <>
            <AppPage className={styles.container} title="My Group Projects" subtitle={<GroupWorkPageSubtitle />}>
                {data.loading ? <GroupWorkIndexSkeleton /> : <GroupWorkOverviewContent data={data} sorting={sorting} navigate={navigate} />}
            </AppPage>
            <BackToTop />
        </>
    );
}

function prependProject(project, setProjects) {
  setProjects((prev) => [project, ...prev]);
}
