/*
 * GroupWork project row info section.
 */

import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge/Badge";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import MemberAvatar from "./MemberAvatar";
import { getProjectTeacherInitials, getProjectTeacherName, openTeacherProfile } from "../utils/projectRowUtils";
import { getDisplayName, openMemberProfile } from "./memberAvatarUtils";
import styles from "./ProjectRow.module.css";

export default function ProjectRowInfo({ project, members, totalMembers = 0, action = null }) {
  return (
    <div className={styles.projectInfoArea}>
      <ProjectTeacherAvatar project={project} />
      <div className={styles.projectText}>
        <div className={styles.projectTitleRow}>
          <div className={styles.projectName}>{project.name}</div>
          {action ? <div className={styles.projectTitleAction}>{action}</div> : null}
        </div>
        <AvatarStack members={members} totalMembers={totalMembers} />
      </div>
    </div>
  );
}

function ProjectTeacherAvatar({ project }) {
  const fallback = getProjectTeacherInitials(project);
  const teacherName = getProjectTeacherName(project);
  if (!project?.module_tutor_id) {
    return (
      <div className={styles.teacherAvatarShell} aria-hidden="true">
        <span className={styles.teacherAvatarFallback} aria-hidden="true">{fallback}</span>
      </div>
    );
  }
  return (
    <Tooltip content={`View ${teacherName}'s profile`} wrapperClassName={styles.avatarTooltipWrap}>
      <button
        type="button"
        className={`${styles.teacherAvatarShell} ${styles.teacherAvatarButton}`}
        onClick={(event) => openTeacherProfile(event, project)}
        aria-label={`View ${teacherName}'s profile`}
      >
        <span className={styles.teacherAvatarFallback}>{fallback}</span>
      </button>
    </Tooltip>
  );
}

export function ProjectModuleBadge({ project }) {
  if (!project.course_code && !project.module_name) return null;
  return (
    <Link to={`/modules?code=${encodeURIComponent(project.course_code || "")}`} className={styles.projectModuleLink} aria-label={`Open ${project.module_name || project.course_code} module`}>
      <Badge className={styles.projectModuleBadge}>
        {project.course_code ? <span className={styles.projectModuleCode}>{project.course_code}</span> : null}
        <span>{project.module_name || project.course_code}</span>
      </Badge>
    </Link>
  );
}

function AvatarStack({ members, totalMembers }) {
  if (!members.length && !totalMembers) return null;
  return (
    <div className={styles.avatarStack}>
      {members.map((member, index) => (
        <AvatarItem key={member.id ?? member.user ?? member.user_name ?? index} member={member} index={index} />
      ))}
      <span className={styles.avatarCountLabel}>
        {totalMembers || members.length} member{(totalMembers || members.length) === 1 ? "" : "s"}
      </span>
    </div>
  );
}

function AvatarItem({ member, index }) {
  return (
    <Tooltip content={getDisplayName(member)} wrapperClassName={styles.avatarTooltipWrap}>
      <button
        type="button"
        className={styles.avatarWrapper}
        style={{ zIndex: 10 - index }}
        aria-label={`Open ${getDisplayName(member)} profile`}
        onClick={(event) => openMemberProfile(event, member)}
      >
        <MemberAvatar member={member} size={24} />
      </button>
    </Tooltip>
  );
}
