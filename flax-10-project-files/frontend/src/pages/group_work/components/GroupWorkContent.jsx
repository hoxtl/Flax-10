/*
 * GroupWork project list content.
 */

import { useState } from "react";
import PageToolbar, { ToolbarSortControl } from "../../../components/common/page_toolbar/PageToolbar";
import AnimatedDropdown from "../../../components/common/animated_dropdown";
import SearchBar from "../../../components/common/search_bar/SearchBar";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import CreateProjectForm from "./CreateProjectForm";
import ProjectRow from "./ProjectRow";
import { compareProjectsBySort } from "../utils/projectRowUtils";
import styles from "./GroupWorkContent.module.css";

const SORT_OPTIONS = [
  { value: "due-date", label: "Due date (soonest first)" },
  { value: "due-date-desc", label: "Due date (latest first)" },
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

function filterProjects(projects, searchTerm) {
  if (!searchTerm) return projects;
  const lower = searchTerm.toLowerCase();
  return projects.filter((p) => (p.name || "").toLowerCase().includes(lower));
}

function EmptyState({ isSearching }) {
  const title = isSearching ? "No projects match your search." : "No group projects yet.";
  const hint = isSearching ? "Try searching for a different project name." : "Create a shared project linked to one of your modules and start planning time with your teammates.";
  return <SearchEmptyState title={title} hint={hint} icon={null} className={styles.emptyStateCard} titleClassName={styles.emptyStateTitle} hintClassName={styles.emptyStateHint} />;
}

export default function GroupWorkContent({ projects, projectListProps, sortBy, setSortBy, onProjectCreated }) {
  const [searchTerm, setSearchTerm] = useState("");
  const filtered = filterProjects(projects, searchTerm);
  const sorted = sortProjects(filtered, sortBy);
  return (
    <div className={styles.projectsSection}>
      <ProjectsHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} sortBy={sortBy} setSortBy={setSortBy} onProjectCreated={onProjectCreated} />
      {sorted.length === 0 ? <EmptyState isSearching={!!searchTerm} /> : <ProjectList projects={sorted} projectListProps={projectListProps} />}
    </div>
  );
}

function ProjectsHeaderControls({ searchTerm, setSearchTerm, sortBy, setSortBy, onProjectCreated }) {
  return (
    <div className={styles.projectsHeaderActions}>
      <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search projects..." className={styles.searchBar} />
      <ToolbarSortControl className={styles.sortControl}>
        <AnimatedDropdown className={styles.sortDropdownWrap} value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} placeholder="Choose a sort" usePortal triggerClassName={styles.sortDropdownTrigger} />
      </ToolbarSortControl>
      <CreateProjectForm onCreated={onProjectCreated} size="small" className={styles.createButton} />
    </div>
  );
}

function ProjectsHeader({ searchTerm, setSearchTerm, sortBy, setSortBy, onProjectCreated }) {
  const controls = <ProjectsHeaderControls searchTerm={searchTerm} setSearchTerm={setSearchTerm} sortBy={sortBy} setSortBy={setSortBy} onProjectCreated={onProjectCreated} />;
  return <PageToolbar className={styles.projectsHeader} controlsSlot={controls} />;
}

function ProjectList({ projects, projectListProps }) {
  return <div className={styles.projectList}>{projects.map((project) => <ProjectRow key={project.id} project={project} {...projectListProps(project)} />)}</div>;
}
