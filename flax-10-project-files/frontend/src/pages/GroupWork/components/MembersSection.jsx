/*
 * GroupWork project members section.
 */

import React from "react";
import MemberAvatar from "./MemberAvatar";
import { getDisplayName, openMemberProfile } from "../utils/memberAvatarUtils";
import styles from "./MembersSection.module.css";

function MemberPill({ member, onRemove, canRemove }) {
  return (
    <div className={styles.memberPill}>
      <button
        type="button"
        className={styles.memberAvatarButton}
        title={getDisplayName(member)}
        aria-label={`Open ${getDisplayName(member)} profile`}
        onClick={(event) => openMemberProfile(event, member)}
      >
        <MemberAvatar member={member} size={24} />
      </button>
      <span className={styles.memberName}>{getDisplayName(member)}</span>
      {member.role === "owner" ? <span className={styles.ownerLabel}>Owner</span> : null}
      {canRemove && member.role !== "owner" && (
        <button type="button" onClick={() => onRemove(member.id)} className={styles.removeBtn}>Remove</button>
      )}
    </div>
  );
}

export default function MembersSection({ members, onRemove, canRemove = false }) {
  return (
    <section className={styles.membersSection}>
      <h2 className={styles.membersTitle}>Members</h2>
      <div className={styles.membersList}>
        {members.map((m) => <MemberPill key={m.id} member={m} onRemove={onRemove} canRemove={canRemove} />)}
        {members.length === 0 && <p className={styles.emptyText}>No teammates added yet. Invite collaborators below.</p>}
      </div>
    </section>
  );
}
