/*
 * GroupWork project header metadata.
 */

import { UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge/Badge";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import { getProjectTeacherName, openTeacherProfile } from "../utils/projectRowUtils";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "./memberAvatarUtils";
import styles from "./ProjectHeader.module.css";

export function ProjectHeaderMeta({ project, members }) {
  return (
    <div className={styles.metaStack}>
      <ProjectMembersMeta members={members} />
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

export function ProjectTeacherMeta({ project }) {
  const teacherName = getProjectTeacherName(project);
  if (!teacherName) return null;

  return (
    <button
      type="button"
      className={styles.teacherPillBtn}
      onClick={(e) => openTeacherProfile(e, project)}
      aria-label={`Open ${teacherName}'s profile`}
    >
      <Badge className={styles.teacherPill}>
        <UserRound size={13} className={styles.metaIcon} />
        <span>{teacherName}</span>
      </Badge>
    </button>
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
