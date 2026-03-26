/*
 * GroupWork project header metadata.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import Badge from "../../../components/common/badge/Badge";
import Tooltip from "../../../components/common/tooltip/Tooltip";
import StandardModal from "../../../components/common/standard_modal/StandardModal";
import HoldConfirmModal from "../../../components/common/hold_confirm_modal/HoldConfirmModal";
import { getProjectMemberCount, getProjectTeacherName, openTeacherProfile } from "../utils/projectRowUtils";
import AddMemberForm from "./AddMemberForm";
import MembersSection from "./MembersSection";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile, getStoredViewer } from "../utils/memberAvatarUtils";
import styles from "./ProjectHeader.module.css";

export function ProjectHeaderMeta({ project, members, teamMembers = [], onMemberAdded, onMemberRemove, onDeleteProject }) {
  return (
    <div className={styles.metaStack}>
      <ProjectMembersMeta
        project={project}
        members={members}
        teamMembers={teamMembers}
        onMemberAdded={onMemberAdded}
        onMemberRemove={onMemberRemove}
        onDeleteProject={onDeleteProject}
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

function currentUserIsOwner(members) {
  const viewer = getStoredViewer();
  const viewerId = String(viewer.id ?? viewer.user ?? "");
  if (!viewerId) return false;
  return members.some((m) => String(m.user ?? "") === viewerId && m.role === "owner");
}

function TeamAvatarStrip({ members, onShowMore }) {
  const displayLimit = 10;
  const hasMore = members.length > displayLimit;
  const visible = hasMore ? members.slice(0, displayLimit - 1) : members;
  const moreCount = members.length - (displayLimit - 1);

  return (
    <div className={styles.memberAvatarStrip}>
      {visible.map((member, i) => (
        <MemberAvatarItem key={member.id || i} member={member} index={i} total={visible.length + (hasMore ? 1 : 0)} />
      ))}
      {hasMore && (
        <button type="button" className={styles.moreAvatarsBtn} onClick={onShowMore} aria-label={`View ${moreCount} more members`}>
          +{moreCount}
        </button>
      )}
    </div>
  );
}

function MemberAvatarItem({ member, index, total }) {
  const label = `Open ${getDisplayName(member)} profile`;
  const zIndex = total - index;
  return (
    <Tooltip content={getDisplayName(member)} wrapperClassName={styles.memberTooltipWrap}>
      <button type="button" className={styles.memberAvatarButton} style={{ zIndex }} aria-label={label} onClick={(e) => openMemberProfile(e, member)}>
        <MemberAvatar member={member} size={22} />
      </button>
    </Tooltip>
  );
}

function TeamManagerPanelContent({ project, teamMembers, onMemberAdded, removalFlow, canManageTeam }) {
  return (
    <div className={styles.teamManagerPanel}>
      <AddMemberForm projectId={project.id} members={teamMembers} onAdded={onMemberAdded} />
      <MembersSection members={teamMembers} onRemove={removalFlow.handleRemove} canRemove={canManageTeam} allowOwnerRemove={removalFlow.allowOwnerRemove} />
      {removalFlow.ownerModal}
    </div>
  );
}

function TeamManagementPanel({ project, teamMembers, onMemberAdded, onMemberRemove, canManageTeam, isEditing, removalFlow }) {
  if (!canManageTeam) return null;
  return (
    <AnimatePresence initial={false}>
      {isEditing && (
        <motion.div key="teamPanel" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }} style={{ overflow: "hidden" }}>
          <TeamManagerPanelContent project={project} teamMembers={teamMembers} onMemberAdded={onMemberAdded} removalFlow={removalFlow} canManageTeam={canManageTeam} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MembersModal({ isOpen, onClose, teamMembers }) {
  if (!isOpen) return null;
  return (
    <StandardModal title="Team Members" onClose={onClose} size="sm">
      <div className={styles.modalMembersList}>
        <MembersSection members={teamMembers} canRemove={false} />
      </div>
    </StandardModal>
  );
}

function ProjectMembersMeta({ project, members, teamMembers, onMemberAdded, onMemberRemove, onDeleteProject }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const canManageTeam = currentUserIsOwner(teamMembers);
  const teamCount = teamMembers.length;
  const removalFlow = useMemberRemovalFlow(teamMembers, onMemberRemove, onDeleteProject);
  if (!members.length && !teamMembers.length) return null;
  return (
    <div className={styles.memberMetaStack}>
      <MembersMetaHeader members={members} count={teamCount} canManage={canManageTeam} isEditing={isEditing} setEditing={setIsEditing} onShowAll={() => setShowAllMembers(true)} />
      <TeamManagementPanel project={project} teamMembers={teamMembers} onMemberAdded={onMemberAdded} onMemberRemove={onMemberRemove} canManageTeam={canManageTeam} isEditing={isEditing} removalFlow={removalFlow} />
      <MembersModal isOpen={showAllMembers} onClose={() => setShowAllMembers(false)} teamMembers={teamMembers} />
    </div>
  );
}

function MembersMetaHeader({ members, count, canManage, isEditing, setEditing, onShowAll }) {
  return (
    <div className={styles.memberMeta}>
      <span className={styles.memberMetaLabel}>Team</span>
      <div className={styles.memberMetaBody}>
        <TeamAvatarStrip members={members} onShowMore={onShowAll} />
        <button type="button" className={styles.memberCountBtn} onClick={onShowAll}>
          <span className={styles.memberCountCopy}>{count} member{count === 1 ? "" : "s"}</span>
        </button>
        {canManage && <TeamManageToggle isEditing={isEditing} onToggle={() => setEditing((c) => !c)} />}
      </div>
    </div>
  );
}

function TeamManageToggle({ isEditing, onToggle }) {
  return (
    <button type="button" className={styles.teamManageBtn} onClick={onToggle}>
      {isEditing ? "Done" : "Edit team"}
    </button>
  );
}

  function useMemberRemovalFlow(teamMembers, onMemberRemove, onDeleteProject) {
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const soloOwnerId = getSoloOwnerId(teamMembers);
  const handleRemove = (id) => (soloOwnerId && String(id) === String(soloOwnerId) ? setShowOwnerModal(true) : onMemberRemove(id));
  const confirmOwnerRemoval = async () => {
    setShowOwnerModal(false);
    await onDeleteProject?.();
  };
  const ownerModal = showOwnerModal && (
    <HoldConfirmModal title="Delete project" warningBanner="You're the only member in this project." warningText="Removing yourself deletes the project for everyone." cancelLabel="Keep project" holdLabel="Hold to delete" onCancel={() => setShowOwnerModal(false)} onConfirm={confirmOwnerRemoval} />
  );
  return { handleRemove, ownerModal, allowOwnerRemove: Boolean(soloOwnerId) };
}

  function getSoloOwnerId(members) {
    if (members.length !== 1) return null;
    const [member] = members;
    return member?.role === "owner" ? member.id : null;
  }
