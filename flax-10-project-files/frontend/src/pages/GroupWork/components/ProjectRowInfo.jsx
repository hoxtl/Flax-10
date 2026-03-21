/*
 * GroupWork project row info section.
 */

import MemberAvatar from "./MemberAvatar";
import { getDisplayName } from "./memberAvatarUtils";
import styles from "./ProjectRow.module.css";

export default function ProjectRowInfo({ project, members }) {
  return (
    <div className={styles.projectInfoArea}>
      <div className={styles.projectIcon}>{project.name ? project.name.charAt(0).toUpperCase() : "P"}</div>
      <div className={styles.projectText}>
        <div className={styles.projectName}>{project.name}</div>
        {project.module_name && <div className={styles.projectModule}>{project.module_name}</div>}
        <AvatarStack members={members} />
      </div>
    </div>
  );
}

function AvatarStack({ members }) {
  const avatars = members.slice(0, 3);
  const remaining = members.length > 3 ? members.length - 3 : 0;
  return (
    <div className={styles.avatarStack}>
      {avatars.map((member, index) => <AvatarItem key={member.id} member={member} index={index} />)}
      {remaining > 0 && <div className={styles.avatarPill}>+{remaining}</div>}
    </div>
  );
}

function AvatarItem({ member, index }) {
  return (
    <div className={styles.avatarWrapper} style={{ zIndex: 10 - index }} title={getDisplayName(member)}>
      <MemberAvatar member={member} size={24} />
    </div>
  );
}
