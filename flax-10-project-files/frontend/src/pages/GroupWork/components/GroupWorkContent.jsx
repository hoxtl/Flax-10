import React from "react";
import ProjectRow from "./ProjectRow";
import styles from "./GroupWorkContent.module.css";

function filterProjects(projects, filter) {
  return projects.filter(p => {
    if (filter === "all") return true;
    
    const deadline = p.deadline ? new Date(p.deadline) : null;
    const days = deadline ? Math.ceil((deadline - Date.now()) / (1000 * 60 * 60 * 24)) : Infinity;

    if (filter === "due_soon") return days > 0 && days <= 30;
    if (filter === "later") return days > 30 || days === Infinity;
    
    return true;
  });
}

export default function GroupWorkContent({ projects, projectListProps, filter, setFilter }) {
  const filteredProjects = filterProjects(projects, filter);

  return (
    <div className={styles.projectsSection}>
      <div className={styles.projectsHeader}>
        <h3 className={styles.sectionTitle}>PROJECTS</h3>
        <FilterTabs filter={filter} setFilter={setFilter} />
      </div>
      
      {filteredProjects.length === 0 ? (
        <p className={styles.emptyMessage}>No projects match this filter.</p>
      ) : (
        <div className={styles.projectList}>
          {filteredProjects.map((p) => (
            <ProjectRow key={p.id} project={p} {...projectListProps(p)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterTabs({ filter, setFilter }) {
    const tabs = [
        { id: "all", label: "All" },
        { id: "due_soon", label: "Due soon" },
        { id: "later", label: "Later" }
    ];

    return (
        <div className={styles.filterTabs}>
            {tabs.map(t => (
                <button 
                  key={t.id}
                  className={`${styles.filterTab} ${filter === t.id ? styles.filterTabActive : ""}`} 
                  onClick={() => setFilter(t.id)}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}
