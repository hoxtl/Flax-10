/*
 * GroupWork project header metadata.
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound } from "lucide-react";
import Badge from "../../../components/common/Badge/Badge";
import Tooltip from "../../../components/common/Tooltip/Tooltip";
import HoldConfirmModal from "../../../components/common/HoldConfirmModal/HoldConfirmModal";
import { getProjectMemberCount, getProjectTeacherName, openTeacherProfile } from "../utils/projectRowUtils";
import AddMemberForm from "./AddMemberForm";
import MembersSection from "./MembersSection";
import MemberAvatar from "./MemberAvatar";
import GroupWorkProjectModuleBadge from "./ProjectModuleBadge";
import { getDisplayName, openMemberProfile } from "../utils/memberAvatarUtils";
import { useAuth } from "../../../context/AuthContext";
import styles from "./ProjectHeader.module.css";

export function ProjectModuleTag({ project }) {
  return (
    <GroupWorkProjectModuleBadge
      project={project}
      linkClassName={styles.metaLink}
      badgeClassName={styles.modulePill}
      codeClassName={styles.moduleCode}
    />
  );
}

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

function useIsOwner(members) {
  const { profile } = useAuth();
  return useMemo(() => {
    if (!profile?.id) return false;
    return members.some((m) => String(m.user ?? "") === String(profile.id) && m.role === "owner");
  }, [members, profile?.id]);
}

function TeamAvatarStrip({ members }) {
  return (
    <div className={styles.memberAvatarStrip}>
      {members.map((member, i) => <MemberAvatarItem key={member.id || i} member={member} index={i} />)}
    </div>
  );
}

function MemberAvatarItem({ member, index }) {
  const label = `Open ${getDisplayName(member)} profile`;
  return (
    <Tooltip content={getDisplayName(member)} wrapperClassName={styles.memberTooltipWrap}>
      <button type="button" className={styles.memberAvatarButton} style={{ zIndex: 10 - index }} aria-label={label} onClick={(e) => openMemberProfile(e, member)}>
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

function ProjectMembersMeta({ project, members, teamMembers, onMemberAdded, onMemberRemove, onDeleteProject }) {
  const [isEditing, setIsEditing] = useState(false);
  const canManageTeam = useIsOwner(teamMembers);
  const teamCount = teamMembers.length;
  const removalFlow = useMemberRemovalFlow(teamMembers, onMemberRemove, onDeleteProject);
  if (!members.length && !teamMembers.length) return null;
  return (
    <div className={styles.memberMetaStack}>
      <MembersMetaHeader members={members} count={teamCount} canManage={canManageTeam} isEditing={isEditing} setEditing={setIsEditing} />
      <TeamManagementPanel project={project} teamMembers={teamMembers} onMemberAdded={onMemberAdded} onMemberRemove={onMemberRemove} canManageTeam={canManageTeam} isEditing={isEditing} removalFlow={removalFlow} />
    </div>
  );
}

function MembersMetaHeader({ members, count, canManage, isEditing, setEditing }) {
  return (
    <div className={styles.memberMeta}>
      <span className={styles.memberMetaLabel}>Team</span>
      <div className={styles.memberMetaBody}>
        <TeamAvatarStrip members={members} />
        <span className={styles.memberCountCopy}>{count} member{count === 1 ? "" : "s"}</span>
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
