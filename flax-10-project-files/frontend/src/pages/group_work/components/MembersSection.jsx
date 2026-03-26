/*
 * GroupWork project members section.
 */

import React from "react";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "../utils/memberAvatarUtils";
import styles from "./MembersSection.module.css";

function MemberPill({ member, onRemove, canRemove, allowOwnerRemove }) {
  const displayName = getDisplayName(member);
  const isOwner = member.role === "owner";
  const removeAllowed = canRemove && (!isOwner || allowOwnerRemove);
  const removeLabel = isOwner ? "Leave project" : "Remove";

  return (
    <div className={styles.memberPill}>
      <button type="button" className={styles.memberProfileBtn} title={`Open ${displayName} profile`} onClick={(e) => openMemberProfile(e, member)}>
        <MemberAvatar member={member} size={24} />
        <span className={styles.memberName}>{displayName}</span>
      </button>
      {isOwner && <span className={styles.ownerLabel}>Owner</span>}
      {removeAllowed && <button type="button" onClick={() => onRemove(member.id)} className={styles.removeBtn}>{removeLabel}</button>}
    </div>
  );
}

export default function MembersSection({ members, onRemove, canRemove = false, allowOwnerRemove = false }) {
  return (
    <section className={styles.membersSection}>
      <h2 className={styles.membersTitle}>Members</h2>
      <div className={styles.membersList}>
        {members.map((m) => (
          <MemberPill
            key={m.id}
            member={m}
            onRemove={onRemove}
            canRemove={canRemove}
            allowOwnerRemove={allowOwnerRemove}
          />
        ))}
        {members.length === 0 && <p className={styles.emptyText}>No teammates added yet. Invite collaborators below.</p>}
      </div>
    </section>
  );
}
