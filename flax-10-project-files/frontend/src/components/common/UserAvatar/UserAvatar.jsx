import styles from './UserAvatar.module.css';

export default function UserAvatar({ user, onClick, avatarOnly = false, size }) {
    if (!user) return null;

    const initial = getInitial(user);
    const photoUrl = user.profile_photo_url || user.profile_photo || user.avatar;
    const fullName = getFullName(user);

    if (avatarOnly) return <AvatarCircle initial={initial} photoUrl={photoUrl} size={size} />;

    return (
        <div className={styles.userInfo} onClick={onClick}>
            <AvatarCircle initial={initial} photoUrl={photoUrl} />
            <div className={styles.userNameDetails}>
                <span className={styles.userFullName}>{fullName}</span>
                <span className={styles.userHandle}>@{user.username}</span>
            </div>
        </div>
    );
}

function AvatarCircle({ initial, photoUrl, size }) {
    const sizeStyle = size ? { width: size, height: size, fontSize: `${parseInt(size) / 2.5}px` } : {};
    if (photoUrl) return <img src={photoUrl} alt="" className={styles.avatar} style={sizeStyle} />;
    return <div className={styles.avatar} style={sizeStyle}>{initial}</div>;
}

function getInitial(user) {
    return user.first_name?.[0] || user.username?.[0] || '?';
}

function getFullName(user) {
    const { first_name = '', last_name = '', username = '' } = user;
    return (first_name || last_name) ? `${first_name} ${last_name}`.trim() : username;
}
