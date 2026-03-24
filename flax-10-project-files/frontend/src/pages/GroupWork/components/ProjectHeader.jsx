/*
 * GroupWork project header.
 */

import { CalendarDays, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import ProjectDeleteAction from "./ProjectHeaderSub";
import { ProjectHeaderMeta, ProjectTeacherMeta } from "./ProjectHeaderMeta";
import DeadlineCountdown from "../../../components/common/DeadlineCountdown/DeadlineCountdown";
import BackButton from "../../../components/common/BackButton/BackButton.jsx";
import { formatProjectHeadlineDate, getProjectCaption, getProjectDate } from "../utils/projectRowUtils";
import styles from "./ProjectHeader.module.css";

function ProjectHeaderContent({ project, date, members, teamMembers, onMemberAdded, onMemberRemove, onDelete }) {
  return (
    <div className={styles.headerCard}>
      <div className={styles.headerCopy}>
        <ProjectHeaderTitle project={project} date={date} />
        <ProjectHeaderSubtitle project={project} />
        <ProjectHeaderMeta
          project={project}
          members={members}
          teamMembers={teamMembers}
          onMemberAdded={onMemberAdded}
          onMemberRemove={onMemberRemove}
          onDeleteProject={onDelete}
        />
      </div>
    </div>
  );
}

function ProjectHeaderTitle({ project, date }) {
  return (
    <div className={styles.titleRow}>
      <h1 className={styles.title}>{project.name}</h1>
      <div className={styles.headerRightMeta}>
        <HeaderDeadlineMeta date={date} />
        <div className={styles.headerPillRow}>
          <ProjectModulePill project={project} />
          <ProjectTeacherMeta project={project} />
        </div>
      </div>
    </div>
  );
}

function ProjectHeaderSubtitle({ project }) {
  return (
    <div className={styles.subtitleRow}>
      <p className={styles.subtitle}>{getProjectCaption(project)}</p>
    </div>
  );
}

/** Header section for a group project, showing title, deadline, members, and delete action. */

export default function ProjectHeader({ project, members, teamMembers, onMemberAdded, onMemberRemove, onDelete, onBack }) {
    const date = getProjectDate(project.deadline);
    return (
        <section className={styles.headerSection}>
            <div className={styles.topActions}>
                <BackButton onClick={onBack} label="Back to all projects" />
                <ProjectDeleteAction onDelete={onDelete} />
            </div>
            <ProjectHeaderContent project={project} date={date} members={members} teamMembers={teamMembers} onMemberAdded={onMemberAdded} onMemberRemove={onMemberRemove} onDelete={onDelete} />
        </section>
    );
}

function ProjectModulePill({ project }) {
    const code = project.course_code;
    const name = project.module_name;
    if (!code && !name) return null;
    return (
        <Link to={`/modules?code=${encodeURIComponent(code || "")}`} className={styles.modulePillBtn} aria-label={`Open ${name || code} module`}>
            <div className={styles.modulePillRight}>
                <BookOpen size={13} className={styles.metaIcon} />
                <span>{code ? <>{code}{name ? ` ${name}` : ""}</> : name}</span>
            </div>
        </Link>
    );
}

function HeaderDeadlineMeta({ date }) {
    if (!date) return null;
    return (
        <div className={styles.inlineDeadlineMeta}>
            <span className={styles.inlineDeadlineDate}>
                <CalendarDays size={14} />
                <span>{formatProjectHeadlineDate(date)}</span>
            </span>
            <span className={styles.inlineDeadlineSeparator} aria-hidden="true">•</span>
            <DeadlineCountdown dueDate={date} showPriority={false} forceClock align="start" className={styles.inlineCountdown} />
        </div>
    );
}
