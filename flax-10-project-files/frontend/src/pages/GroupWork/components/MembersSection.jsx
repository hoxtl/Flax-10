import React from "react";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "./memberAvatarUtils";
import styles from "./MembersSection.module.css";

function MemberPill({ member, onRemove, canRemove, allowOwnerRemove }) {
  const displayName = getDisplayName(member);
  const removeAllowed = canRemove && (member.role !== "owner" || allowOwnerRemove);
  const removeLabel = member.role === "owner" ? "Leave project" : "Remove";
  return (
    <div className={styles.memberPill}>
      <button
        type="button"
        className={styles.memberAvatarButton}
        title={displayName}
        aria-label={`Open ${displayName} profile`}
        onClick={(event) => openMemberProfile(event, member)}
      >
        <MemberAvatar member={member} size={24} />
      </button>
      <span className={styles.memberName}>{displayName}</span>
      {member.role === "owner" ? <span className={styles.ownerLabel}>Owner</span> : null}
      {removeAllowed ? (
        <button type="button" onClick={() => onRemove(member.id)} className={styles.removeBtn}>{removeLabel}</button>
      ) : null}
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
