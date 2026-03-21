/*
 * GroupWork project list content.
 */

import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import ProjectRow from "./ProjectRow";
import styles from "./GroupWorkContent.module.css";

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "due_soon", label: "Due soon" },
  { id: "later", label: "Later" },
];

function filterProjects(projects, filter) {
  return projects.filter((project) => matchesProjectFilter(project, filter));
}

function matchesProjectFilter(project, filter) {
  if (filter === "all") return true;
  const days = getDaysUntilDeadline(project.deadline);
  if (filter === "due_soon") return days > 0 && days <= 30;
  if (filter === "later") return days > 30 || days === Infinity;
  return true;
}

function getDaysUntilDeadline(deadline) {
  if (!deadline) return Infinity;
  return Math.ceil((new Date(deadline) - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function GroupWorkContent({ projects, projectListProps, filter, setFilter }) {
  const filteredProjects = filterProjects(projects, filter);
  return (
    <div className={styles.projectsSection}>
      <ProjectsHeader filter={filter} setFilter={setFilter} />
      {filteredProjects.length === 0 ? <p className={styles.emptyMessage}>No projects match this filter.</p> : <ProjectList projects={filteredProjects} projectListProps={projectListProps} />}
    </div>
  );
}

function ProjectsHeader({ filter, setFilter }) {
  return (
    <div className={styles.projectsHeader}>
      <h3 className={styles.sectionTitle}>PROJECTS</h3>
      <SegmentedControl options={FILTER_TABS.map((tab) => ({ value: tab.id, label: tab.label }))} value={filter} onChange={setFilter} />
    </div>
  );
}

function ProjectList({ projects, projectListProps }) {
  return <div className={styles.projectList}>{projects.map((project) => <ProjectRow key={project.id} project={project} {...projectListProps(project)} />)}</div>;
}
