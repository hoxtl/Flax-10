/*
 * Shared admin badges.
 */

import styles from "../styles";

const ROLE_BADGE_STYLES = {
  pending_teacher: styles.badgePending,
  student: styles.badgeStudent,
  teacher: styles.badgeTeacher,
};

const MOBILE_ROLE_STYLES = {
  pending_teacher: styles.rolePending,
  student: styles.roleStudent,
  teacher: styles.roleTeacher,
};

function formatRole(role) {
  return role.replace("_", " ");
}

export function RoleBadge({ role }) {
  const roleStyle = ROLE_BADGE_STYLES[role] || styles.badgeStudent;
  return <span className={`${styles.badge} ${roleStyle}`}>{formatRole(role)}</span>;
}

export function MobileRoleBadge({ role }) {
  const roleStyle = MOBILE_ROLE_STYLES[role] || styles.roleStudent;
  return <span className={`${styles.roleTag} ${roleStyle}`}>{formatRole(role)}</span>;
}

export function StatusBadge({ active }) {
  return <span className={`${styles.badge} ${active ? styles.badgeActive : styles.badgeBanned}`}>{active ? "Active" : "Banned"}</span>;
}
