import FollowButton from './FollowButton';
import styles from './Social.module.css';

export default function UserListModal({ title, users, onClose, onUserClick }) {
    if (!users) return null;

    // Get the current user to verify we don't show the follow button next to their own name
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    // Sort users: 
    // 1. Current user
    // 2. Users the current user is following
    // 3. Everyone else
    const sortedUsers = [...users].sort((a, b) => {
        const aIsMe = a.id === currentUser.id || a.username === currentUser.username;
        const bIsMe = b.id === currentUser.id || b.username === currentUser.username;
        if (aIsMe) return -1;
        if (bIsMe) return 1;

        if (a.is_following && !b.is_following) return -1;
        if (!a.is_following && b.is_following) return 1;

        return 0; // maintain original order for the rest
    });

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.userList}>
                    {sortedUsers.length === 0 ? (
                        <p className={styles.emptyText}>No users found.</p>
                    ) : (
                        sortedUsers.map((u, index) => (
                            <div
                                key={u.id || u.username || index}
                                className={styles.userItem}
                                onClick={() => onUserClick && onUserClick(u)}
                            >
                                <div className={styles.userInfo}>
                                    <div className={styles.avatar}>{u.first_name?.[0] || u.username[0]}</div>
                                    <div className={styles.userNameDetails}>
                                        <span className={styles.userFullName}>
                                            {u.first_name} {u.last_name}
                                        </span>
                                        <span className={styles.userHandle}>@{u.username}</span>
                                    </div>
                                </div>
                                {u.id !== currentUser.id && u.username !== currentUser.username && (
                                    <FollowButton
                                        userId={u.id}
                                        initialIsFollowing={u.is_following}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
