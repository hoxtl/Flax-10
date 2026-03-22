/*
 * GroupWork project list content.
 */

import PageToolbar, { ToolbarSortControl } from "../../../components/common/PageToolbar/PageToolbar";
import AnimatedDropdown from "../../../components/common/AnimatedDropdown";
import SearchEmptyState from "../../../components/common/SearchEmptyState/SearchEmptyState";
import CreateProjectForm from "./CreateProjectForm";
import ProjectRow from "./ProjectRow";
import { compareProjectsBySort } from "../utils/projectRowUtils";
import styles from "./GroupWorkContent.module.css";

const SORT_OPTIONS = [
  { value: "due-date", label: "Due date" },
  { value: "created-desc", label: "Date created (newest)" },
  { value: "created-asc", label: "Date created (oldest)" },
  { value: "most-members", label: "Most team members" },
  { value: "least-members", label: "Least team members" },
  { value: "most-completed", label: "Most completed" },
  { value: "least-completed", label: "Least completed" },
  { value: "name", label: "A → Z" },
  { value: "name-desc", label: "Z → A" },
];

function sortProjects(projects, sortBy) {
  const sorted = [...projects];
  sorted.sort((left, right) => compareProjectsBySort(left, right, sortBy));
  return sorted;
}

export default function GroupWorkContent({ projects, projectListProps, sortBy, setSortBy, onProjectCreated }) {
  const sortedProjects = sortProjects(projects, sortBy);
  return (
    <div className={styles.projectsSection}>
      <ProjectsHeader sortBy={sortBy} setSortBy={setSortBy} onProjectCreated={onProjectCreated} />
      {sortedProjects.length === 0 ? (
        <SearchEmptyState
          title="No group projects yet."
          hint="Create a shared project linked to one of your modules and start planning time with your teammates."
          icon={null}
          className={styles.emptyStateCard}
          titleClassName={styles.emptyStateTitle}
          hintClassName={styles.emptyStateHint}
        />
      ) : (
        <ProjectList projects={sortedProjects} projectListProps={projectListProps} />
      )}
    </div>
  );
}

function ProjectsHeader({ sortBy, setSortBy, onProjectCreated }) {
  return (
    <PageToolbar
      className={styles.projectsHeader}
      controlsSlot={
        <div className={styles.projectsHeaderActions}>
          <ToolbarSortControl className={styles.sortControl}>
            <AnimatedDropdown
              className={styles.sortDropdownWrap}
              value={sortBy}
              onChange={setSortBy}
              options={SORT_OPTIONS}
              placeholder="Choose a sort"
              usePortal
              triggerClassName={styles.sortDropdownTrigger}
            />
          </ToolbarSortControl>
          <CreateProjectForm onCreated={onProjectCreated} size="small" className={styles.createButton} />
        </div>
      }
    />
  );
}

function ProjectList({ projects, projectListProps }) {
  return <div className={styles.projectList}>{projects.map((project) => <ProjectRow key={project.id} project={project} {...projectListProps(project)} />)}</div>;
}
