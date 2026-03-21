/*
 * GroupWork project header.
 */

import PageHeader from "../../../components/common/PageHeader/PageHeader";
import ProjectDeleteAction from "./ProjectHeaderSub";
import { ProjectHeaderMeta } from "./ProjectHeaderMeta";
import ProjectProgress from "./ProjectProgress";
import BackButton from "../../../components/common/BackButton/BackButton.jsx";
import { getProjectCaption } from "../utils/projectRowUtils";
import styles from "./ProjectHeader.module.css";

export default function ProjectHeader({ project, members, taskStats, onDelete, onBack }) {
  return (
    <section className={styles.headerSection}>
      <div className={styles.topActions}>
        <BackButton onClick={onBack} label="Back" />
        <ProjectDeleteAction onDelete={onDelete} />
      </div>
      <PageHeader
        title={project.name}
        subtitle={getProjectCaption(project)}
        details={<ProjectHeaderMeta project={project} members={members} />}
      />
      <div className={styles.detailsPanel}>
        <ProjectProgress taskStats={taskStats} />
      </div>
    </section>
  );
}
