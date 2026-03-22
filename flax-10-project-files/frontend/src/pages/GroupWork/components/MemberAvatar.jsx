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
  return <div className={styles.avatar} style={{ ...sizeStyle, background: getUserColor(member.user ?? member.id) }}>{getInitials(member)}</div>;
}
