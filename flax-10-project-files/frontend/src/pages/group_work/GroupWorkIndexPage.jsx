/*
 * GroupWork index page.
 */

import { useNavigate } from "react-router-dom";
import styles from "./styles/GroupWorkIndexPage.module.css";
import { useGroupProjects, useGroupProjectSort, useSelectedProjectId } from "./hooks/groupWorkHooks";
import GroupProjectDetail from "./components/GroupWorkDetail";
import AppPage from "../../components/common/app_page/AppPage";
import { BackToTop } from "../../components/pagination/Pagination";
import GroupWorkStats from "./components/GroupWorkStats";
import GroupWorkIndexSkeleton from "@/pages/group_work/components/GroupWorkIndexSkeleton";
import GroupWorkContent from "./components/GroupWorkContent";
import { useToast } from "../../context/ToastContext";
import { getProjectDate, getDaysLeft } from "./utils/projectRowUtils";
import PrimaryButton from "../../components/common/primary_button/PrimaryButton";

/** Entry point for the GroupWork section, routing between overview and project detail. */

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

function getUrgentProjectDays(project) {
    const days = getDaysLeft(getProjectDate(project.deadline));
    return days !== null && days >= 0 && days <= 7 ? days : null;
}

function getMostUrgentProject(projects) {
    const ranked = (projects || [])
        .map((project) => ({ project, daysLeft: getUrgentProjectDays(project) }))
        .filter(({ daysLeft }) => daysLeft !== null)
        .sort((a, b) => a.daysLeft - b.daysLeft);
    return ranked[0] || null;
}

function deadlineBannerLabel(daysLeft) {
    if (daysLeft === 0) return "due today";
    if (daysLeft === 1) return "due tomorrow";
    return `due in ${daysLeft} days`;
}

function ProjectUrgentBanner({ projects, navigate }) {
    const urgent = getMostUrgentProject(projects);
    if (!urgent) return null;
    const { project, daysLeft } = urgent;
    const label = deadlineBannerLabel(daysLeft);
    const goToSchedule = () => navigate(`/group-work?project=${project.id}&tab=availability`);
    return (
        <div className={styles.deadlineBanner}>
            <span className={styles.deadlineBannerIcon}>⚡</span>
            <span className={styles.deadlineBannerText}>
                <strong>{project.name}</strong> is {label} — slot in a common time with your team before it gets too close.
            </span>
            <div className={styles.deadlineBannerActions}>
                <PrimaryButton size="small" pill onClick={goToSchedule}>
                    Schedule meeting slots
                </PrimaryButton>
            </div>
        </div>
    );
}

function GroupWorkOverviewContent({ data, sorting, navigate, onProjectCreated }) {
    return (
        <>
            <GroupWorkStats projects={data.projects} />
            <ProjectUrgentBanner projects={data.projects} navigate={navigate} />
            <GroupWorkContent
                projects={data.projects}
                projectListProps={(project) => ({ onClick: () => navigate(`/group-work?project=${project.id}`) })}
                sortBy={sorting.sortBy}
                setSortBy={sorting.setSortBy}
                onProjectCreated={onProjectCreated}
            />
        </>
    );
}

function GroupWorkOverview() {
    const navigate = useNavigate();
    const data = useGroupProjects();
    const sorting = useGroupProjectSort();
    const showToast = useToast();
    const handleProjectCreated = (project) => {
        prependProject(project, data.setProjects);
        showToast("Group project created successfully!");
    };
    return (
        <>
            <AppPage className={styles.container} title="My Group Projects" subtitle={<GroupWorkPageSubtitle />}>
                {data.loading ? <GroupWorkIndexSkeleton /> : <GroupWorkOverviewContent data={data} sorting={sorting} navigate={navigate} onProjectCreated={handleProjectCreated} />}
            </AppPage>
            <BackToTop />
        </>
    );
}

function prependProject(project, setProjects) {
  setProjects((prev) => [project, ...prev]);
}

export {
    ProjectDetailRoute,
    GroupWorkPageSubtitle,
    getUrgentProjectDays,
    getMostUrgentProject,
    deadlineBannerLabel,
    ProjectUrgentBanner,
    GroupWorkOverviewContent,
    GroupWorkOverview,
    prependProject,
};
