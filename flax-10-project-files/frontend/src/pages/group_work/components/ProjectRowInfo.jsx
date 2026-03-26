/*
 * GroupWork project row info section.
 */

import { Link } from "react-router-dom";
import Badge from "../../../components/common/badge/Badge";
import Tooltip from "../../../components/common/tooltip/Tooltip";
import MemberAvatar from "./MemberAvatar";
import { getProjectTeacherInitials, getProjectTeacherName, openTeacherProfile } from "../utils/projectRowUtils";
import { getDisplayName, openMemberProfile, getMemberKey } from "../utils/memberAvatarUtils";
import styles from "./ProjectRow.module.css";

export default function ProjectRowInfo({ project, members, totalMembers = 0, action = null, onProjectNavigate, isOwner = false }) {
  return (
    <div className={styles.projectInfoArea}>
      <ProjectTeacherAvatar project={project} />
      <div className={styles.projectText}>
        <ProjectRowTitle project={project} action={action} onNavigate={onProjectNavigate} isOwner={isOwner} />
        <AvatarStack members={members} totalMembers={totalMembers} />
      </div>
    </div>
  );
}

function ProjectRowTitle({ project, action, onNavigate, isOwner }) {
  const label = `Open ${project.name} project details`;
  return (
    <div className={styles.projectTitleRow}>
      <button type="button" className={`${styles.projectName} ${styles.projectNameButton}`} onClick={onNavigate} aria-label={label}>
        {project.name}
      </button>
      {isOwner && <span className={styles.ownerPill}>PROJECT OWNER</span>}
      {action && <div className={styles.projectTitleAction}>{action}</div>}
    </div>
  );
}

function TeacherAvatarShell({ fallback }) {
    return <div className={styles.teacherAvatarShell} aria-hidden="true"><span className={styles.teacherAvatarFallback} aria-hidden="true">{fallback}</span></div>;
}

function TeacherAvatarButton({ fallback, teacherName, project }) {
    return (
        <Tooltip content={`View ${teacherName}'s profile`} wrapperClassName={styles.avatarTooltipWrap}>
            <button type="button" className={`${styles.teacherAvatarShell} ${styles.teacherAvatarButton}`} onClick={(event) => openTeacherProfile(event, project)} aria-label={`View ${teacherName}'s profile`}>
                <span className={styles.teacherAvatarFallback}>{fallback}</span>
            </button>
        </Tooltip>
    );
}

function ProjectTeacherAvatar({ project }) {
    const fallback = getProjectTeacherInitials(project);
    const teacherName = getProjectTeacherName(project);
    if (!project?.module_tutor_id) return <TeacherAvatarShell fallback={fallback} />;
    return <TeacherAvatarButton fallback={fallback} teacherName={teacherName} project={project} />;
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
  const count = totalMembers || members.length;
  if (!count) return null;
  const limit = 10;
  const hasMore = count > limit;
  const visible = hasMore ? members.slice(0, limit - 1) : members;
  const moreCount = count - (limit - 1);
  return (
    <div className={styles.avatarStack}>
      {visible.map((member, i) => (
        <AvatarItem key={getMemberKey(member) || i} member={member} index={i} total={visible.length + (hasMore ? 1 : 0)} />
      ))}
      {hasMore && <div className={styles.moreBadge}>+{moreCount}</div>}
      <span className={styles.avatarCountLabel}>{count} member{count === 1 ? "" : "s"}</span>
    </div>
  );
}

function AvatarItem({ member, index, total }) {
  const label = `Open ${getDisplayName(member)} profile`;
  return (
    <Tooltip content={getDisplayName(member)} wrapperClassName={styles.avatarTooltipWrap}>
      <button type="button" className={styles.avatarWrapper} style={{ zIndex: total - index }} aria-label={label} onClick={(e) => openMemberProfile(e, member)}>
        <MemberAvatar member={member} size={24} />
      </button>
    </Tooltip>
  );
}
