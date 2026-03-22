/*
 * GroupWork project header metadata.
 */

import { useState } from "react";
import { UserRound } from "lucide-react";
import Badge from "../../../components/Common/Badge/Badge";
import Tooltip from "../../../components/Common/Tooltip/Tooltip";
import { getProjectTeacherName, openTeacherProfile } from "../utils/projectRowUtils";
import AddMemberForm from "./AddMemberForm";
import MembersSection from "./MembersSection";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "./memberAvatarUtils";
import styles from "./ProjectHeader.module.css";

function readViewerId() {
  if (typeof window === "undefined") return "";
  try {
    const viewer = JSON.parse(window.localStorage.getItem("user") || "{}");
    return String(viewer.id ?? viewer.user ?? "");
  } catch {
    return "";
  }
}

function currentUserIsOwner(members) {
  const viewerId = readViewerId();
  if (!viewerId) return false;
  return members.some((member) => String(member.user ?? "") === viewerId && member.role === "owner");
}

export function ProjectTeacherMeta({ project }) {
  const teacherName = getProjectTeacherName(project);
  if (!teacherName) return null;
  return (
    <button type="button" className={styles.teacherPillBtn} onClick={(e) => openTeacherProfile(e, project)} aria-label={`Open ${teacherName}'s profile`}>
      <Badge className={styles.teacherPill}>
        <UserRound size={13} className={styles.metaIcon} />
        <span>{teacherName}</span>
      </Badge>
    </button>
  );
}

function MemberAvatarButton({ member, index }) {
  return (
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
  );
}

function MemberAvatarStrip({ members }) {
  return (
    <div className={styles.memberAvatarStrip}>
      {members.map((member, index) => <MemberAvatarButton key={member.id ?? member.user ?? index} member={member} index={index} />)}
    </div>
  );
}

function TeamManagerPanel({ project, teamMembers, onMemberAdded, onMemberRemove, canManageTeam }) {
  return (
    <div className={styles.teamManagerPanel}>
      <AddMemberForm projectId={project.id} members={teamMembers} onAdded={onMemberAdded} />
      <MembersSection members={teamMembers} onRemove={onMemberRemove} canRemove={canManageTeam} />
    </div>
  );
}

function TeamManageButton({ isEditing, setIsEditing }) {
  return <button type="button" className={styles.teamManageBtn} onClick={() => setIsEditing((current) => !current)}>{isEditing ? "Done" : "Edit team"}</button>;
}

function ProjectMembersMeta({ project, members, teamMembers, onMemberAdded, onMemberRemove }) {
  const [isEditing, setIsEditing] = useState(false);
  const canManageTeam = currentUserIsOwner(teamMembers);
  if (!members.length && !teamMembers.length) return null;
  return (
    <div className={styles.memberMetaStack}>
      <div className={styles.memberMeta}>
        <span className={styles.memberMetaLabel}>Team</span>
        <div className={styles.memberMetaBody}>
          <MemberAvatarStrip members={members} />
          {canManageTeam ? <TeamManageButton isEditing={isEditing} setIsEditing={setIsEditing} /> : null}
        </div>
      </div>
      {canManageTeam && isEditing ? (
        <TeamManagerPanel project={project} teamMembers={teamMembers} onMemberAdded={onMemberAdded} onMemberRemove={onMemberRemove} canManageTeam={canManageTeam} />
      ) : null}
    </div>
  );
}

export function ProjectHeaderMeta({ project, members, teamMembers = [], onMemberAdded, onMemberRemove }) {
  return (
    <div className={styles.metaStack}>
      <ProjectMembersMeta project={project} members={members} teamMembers={teamMembers} onMemberAdded={onMemberAdded} onMemberRemove={onMemberRemove} />
    </div>
  );
}
