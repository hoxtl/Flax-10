import styles from './UserAvatar.module.css';

export default function UserAvatar({ user, onClick, avatarOnly = false }) {
    if (!user) return null;

    const initial = getInitial(user);
    const photoUrl = user.profile_photo || user.avatar;
    const fullName = getFullName(user);

    if (avatarOnly) return <AvatarCircle initial={initial} photoUrl={photoUrl} />;

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

function AvatarCircle({ initial, photoUrl }) {
    if (photoUrl) return <img src={photoUrl} alt="" className={styles.avatar} />;
    return <div className={styles.avatar}>{initial}</div>;
}

function getInitial(user) {
    return user.first_name?.[0] || user.username?.[0] || '?';
}

function getFullName(user) {
    const { first_name = '', last_name = '', username = '' } = user;
    return (first_name || last_name) ? `${first_name} ${last_name}`.trim() : username;
}
