/*
 * GroupWork project header metadata.
 */

import { Calendar, Mail, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge/Badge";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import { formatProjectCountdownText, formatProjectHeadlineDate, getProjectDate, getProjectTeacherEmail, getProjectTeacherName } from "../utils/projectRowUtils";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "./memberAvatarUtils";
import styles from "./ProjectHeader.module.css";

export function ProjectHeaderMeta({ project, members }) {
  const date = getProjectDate(project.deadline);
  return (
    <div className={styles.metaStack}>
      <div className={styles.metaRow}>
        <ProjectModuleTag project={project} />
        <ProjectTeacherMeta project={project} />
        <ProjectTeacherEmail project={project} />
      </div>
      <div className={styles.metaRow}>
        <ProjectMembersMeta members={members} />
        <ProjectDeadlineMeta date={date} />
        <ProjectCountdownMeta date={date} />
      </div>
    </div>
  );
}

function ProjectModuleTag({ project }) {
  if (!project.course_code && !project.module_name) return null;
  return (
    <Link to={`/modules?code=${encodeURIComponent(project.course_code || "")}`} className={styles.metaLink}>
      <Badge className={styles.modulePill}>
        {project.course_code ? <span className={styles.moduleCode}>{project.course_code}</span> : null}
        <span>{project.module_name || project.course_code}</span>
      </Badge>
    </Link>
  );
}

function ProjectTeacherMeta({ project }) {
  const teacherName = getProjectTeacherName(project);
  if (!teacherName) return null;
  return (
    <Badge className={styles.teacherPill}>
      <UserRound size={13} className={styles.metaIcon} />
      <span>{teacherName}</span>
    </Badge>
  );
}

function ProjectTeacherEmail({ project }) {
  const email = getProjectTeacherEmail(project);
  if (!email) return null;
  return (
    <a href={`mailto:${email}`} className={styles.contactPill}>
      <Mail size={13} className={styles.metaIcon} />
      <span>{email}</span>
    </a>
  );
}

function ProjectMembersMeta({ members }) {
  if (!members.length) return null;
  return (
    <div className={styles.memberMeta}>
      <span className={styles.memberMetaLabel}>Team</span>
      <div className={styles.memberAvatarStrip}>
        {members.map((member, index) => (
          <Tooltip key={member.id ?? member.user ?? member.user_name ?? index} content={getDisplayName(member)} wrapperClassName={styles.memberTooltipWrap}>
            <button
              type="button"
              className={styles.memberAvatarButton}
              style={{ zIndex: 10 - index }}
              aria-label={`Open ${getDisplayName(member)} profile`}
              onClick={(event) => openMemberProfile(event, member)}
            >
              <MemberAvatar member={member} size={22} />
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function ProjectDeadlineMeta({ date }) {
  if (!date) return null;
  return (
    <div className={styles.textMeta}>
      <Calendar size={14} className={styles.metaIcon} />
      <span>{formatProjectHeadlineDate(date)}</span>
    </div>
  );
}

function ProjectCountdownMeta({ date }) {
  if (!date) return null;
  return <div className={styles.textMeta}>{formatProjectCountdownText(date)}</div>;
}
