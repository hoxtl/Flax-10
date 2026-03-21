import React from "react";
import MemberAvatar from "./MemberAvatar";
import styles from "./MembersSection.module.css";

function MemberPill({ member, onRemove }) {
  return (
    <div className={styles.memberPill}>
      <MemberAvatar member={member} size={24} />
      <span>{member.user_name}</span>
      {member.role !== "owner" && (
        <button type="button" onClick={() => onRemove(member.id)} className={styles.removeBtn}>Remove</button>
      )}
    </div>
  );
}

export default function MembersSection({ members, onRemove }) {
  return (
    <section className={styles.membersSection}>
      <h2 className={styles.membersTitle}>Members</h2>
      <div className={styles.membersList}>
        {members.map((m) => <MemberPill key={m.id} member={m} onRemove={onRemove} />)}
        {members.length === 0 && <p className={styles.emptyText}>No members yet. Add your first member below.</p>}
      </div>
    </section>
  );
}
