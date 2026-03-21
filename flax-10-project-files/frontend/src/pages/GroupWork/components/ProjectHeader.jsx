/*
 * GroupWork project header.
 */

import ProjectHeaderActions, { ProjectHeaderTitle } from "./ProjectHeaderSub";
import { ProjectHeaderMeta } from "./ProjectHeaderMeta";
import ProjectProgress from "./ProjectProgress";
import styles from "./ProjectHeader.module.css";

export default function ProjectHeader({ project, members, onPatch, taskStats, onDelete, onBack }) {
  return (
    <section className={styles.headerSection}>
      <ProjectHeaderActions onBack={onBack} onDelete={onDelete} />
      <div className={styles.headerBody}>
        <ProjectHeaderTitle name={project.name} onPatch={onPatch} />
        <ProjectHeaderMeta project={project} members={members} onPatch={onPatch} />
        <ProjectProgress taskStats={taskStats} />
      </div>
    </section>
  );
}
