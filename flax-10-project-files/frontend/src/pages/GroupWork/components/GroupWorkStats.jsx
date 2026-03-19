import styles from "./GroupWorkStats.module.css";

function calculateDays(targetDate) {
  if (!targetDate) return null;
  const target = new Date(targetDate);
  const diffTime = target - new Date();
  if (diffTime < 0) return null; // Past deadline
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export default function GroupWorkStats({ projects }) {
  if (!projects || projects.length === 0) return null;

  // 1. Active Projects
  const activeCount = projects.length;
  const modulesSet = new Set(projects.map(p => p.course_code).filter(Boolean));
  const modulesCount = modulesSet.size;

  // 2. Next Deadline
  let nextProject = null;
  let minDays = Infinity;
  projects.forEach(p => {
    const days = calculateDays(p.deadline);
    if (days !== null && days < minDays) {
      minDays = days;
      nextProject = p;
    }
  });

  // 3. Collaborators
  const totalCollaborators = projects.reduce((sum, p) => sum + (p.member_count || 1), 0);

  // 4. Overall Progress
  const totalTasks = projects.reduce((sum, p) => sum + (p.task_count || 0), 0);
  const completedTasks = projects.reduce((sum, p) => sum + (p.completed_task_count || 0), 0);
  const totalPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className={styles.statsGrid}>
      <div className={styles.statCard}>
        <div className={styles.statHeader}>ACTIVE PROJECTS</div>
        <div className={styles.statValue}>{activeCount}</div>
        <div className={styles.statSub}>across {modulesCount} module{modulesCount !== 1 ? 's' : ''}</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statHeader}>NEXT DEADLINE</div>
        <div className={styles.statValue}>{nextProject ? minDays : '--'}</div>
        <div className={styles.statSub}>
          {nextProject ? `days — ${nextProject.name}` : 'No upcoming deadlines'}
        </div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statHeader}>COLLABORATORS</div>
        <div className={styles.statValue}>{totalCollaborators}</div>
        <div className={styles.statSub}>across all projects</div>
      </div>

      <div className={styles.statCard}>
        <div className={styles.statHeader}>OVERALL PROGRESS</div>
        <div className={styles.statValue}>{totalPercent}%</div>
        <div className={styles.statSub}>{completedTasks} / {totalTasks} tasks done</div>
      </div>
    </div>
  );
}
