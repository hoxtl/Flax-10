/*
 * User avatar circle with optional name and handle display.
 */

import styles from './UserAvatar.module.css';
import { getResolvedUserPhoto } from '../../../utils/tutorPhotoFallback';

function getInitial(user) {
  return user.first_name?.[0] || user.name?.[0] || user.username?.[0] || user.user_name?.[0] || '?';
}

function getFullName(user) {
  const { first_name = '', last_name = '', username = '', user_name = '', name = '' } = user;
  return name || ((first_name || last_name) ? `${first_name} ${last_name}`.trim() : (username || user_name));
}

function AvatarCircle({ initial, photoUrl, size }) {
  const sizeStyle = size ? { width: size, height: size, fontSize: `${parseInt(size) / 2.5}px` } : {};
  if (photoUrl) return <img src={photoUrl} alt="" className={styles.avatar} style={sizeStyle} />;
  return <div className={styles.avatar} style={sizeStyle}>{initial}</div>;
}

/** User avatar with optional full name and username handle. */
export default function UserAvatar({ user, onClick, avatarOnly = false, size, allowGenericFallback = false }) {
  if (!user) return null;
  const initial = getInitial(user);
  const photoUrl = getResolvedUserPhoto(user, {
    allowGeneric: allowGenericFallback,
    seed: user.username || user.user_name || user.id || getFullName(user),
  });
  if (avatarOnly) return <AvatarCircle initial={initial} photoUrl={photoUrl} size={size} />;
  return (
    <div className={styles.userInfo} onClick={onClick}>
      <AvatarCircle initial={initial} photoUrl={photoUrl} />
      <div className={styles.userNameDetails}>
        <span className={styles.userFullName}>{getFullName(user)}</span>
        <span className={styles.userHandle}>@{user.username}</span>
      </div>
    </div>
  );
}
