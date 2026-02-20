import FollowButton from './FollowButton';
import styles from './Social.module.css';

export default function UserListModal({ title, users, onClose, onUserClick }) {
    if (!users) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <div className={styles.userList}>
                    {users.length === 0 ? (
                        <p className={styles.emptyText}>No users found.</p>
                    ) : (
                        users.map(u => (
                            <div
                                key={u.id}
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
                                <FollowButton
                                    userId={u.id}
                                    initialIsFollowing={u.is_following}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
