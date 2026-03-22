/*
 * GroupWork project header metadata.
 */

import { useState } from "react";
import { UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../../../components/common/Badge/Badge";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import { getProjectMemberCount, getProjectTeacherName, openTeacherProfile } from "../utils/projectRowUtils";
import AddMemberForm from "./AddMemberForm";
import MembersSection from "./MembersSection";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "./memberAvatarUtils";
import styles from "./ProjectHeader.module.css";

export function ProjectHeaderMeta({ project, members, teamMembers = [], onMemberAdded, onMemberRemove }) {
  return (
    <div className={styles.metaStack}>
      <ProjectMembersMeta
        project={project}
        members={members}
        teamMembers={teamMembers}
        onMemberAdded={onMemberAdded}
        onMemberRemove={onMemberRemove}
      />
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

function ProjectMembersMeta({ project, members, teamMembers, onMemberAdded, onMemberRemove }) {
  const [isEditing, setIsEditing] = useState(false);
  const canManageTeam = currentUserIsOwner(teamMembers);
  const teamCount = Math.max(teamMembers.length, getProjectMemberCount(project));
  if (!members.length && !teamMembers.length) return null;

  return (
    <div className={styles.memberMetaStack}>
      <div className={styles.memberMeta}>
        <span className={styles.memberMetaLabel}>Team</span>
        <div className={styles.memberMetaBody}>
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
          <span className={styles.memberCountCopy}>
            {teamCount} member{teamCount === 1 ? "" : "s"}
          </span>
          {canManageTeam ? (
            <button type="button" className={styles.teamManageBtn} onClick={() => setIsEditing((current) => !current)}>
              {isEditing ? "Done" : "Edit team"}
            </button>
          ) : null}
        </div>
      </div>
      {canManageTeam && isEditing ? (
        <div className={styles.teamManagerPanel}>
          <AddMemberForm projectId={project.id} members={teamMembers} onAdded={onMemberAdded} />
          <MembersSection members={teamMembers} onRemove={onMemberRemove} canRemove={canManageTeam} />
        </div>
      ) : null}
    </div>
  );
}

function currentUserIsOwner(members) {
  if (typeof window === "undefined") return false;
  try {
    const viewer = JSON.parse(window.localStorage.getItem("user") || "{}");
    const viewerId = String(viewer.id ?? viewer.user ?? "");
    if (!viewerId) return false;
    return members.some((member) => String(member.user ?? "") === viewerId && member.role === "owner");
  } catch {
    return false;
  }
}
