/*
 * GroupWork member avatar.
 */

import { getUserColor } from "../utils/priorityUtils";
import { getDisplayName, getInitials, getPhotoUrl } from "../utils/memberAvatarUtils";
import styles from "./MemberAvatar.module.css";

export default function MemberAvatar({ member, size = 24 }) {
  const photoUrl = getPhotoUrl(member);
  const sizeStyle = { width: size, height: size };
  const name = getDisplayName(member);
  if (photoUrl) return <img src={photoUrl} alt={name} className={styles.avatar} style={sizeStyle} />;
  const avatarStyle = { width: size, height: size, '--avatar-bg': getUserColor(member.user ?? member.id) };
  return <div className={`${styles.avatar} ${styles.avatarColored}`} style={avatarStyle}>{getInitials(member)}</div>;
}
