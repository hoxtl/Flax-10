import ShareButton from './ShareButton';
import styles from './Social.module.css';

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user')) || {};
}

function isCurrentUser(user, currentUser) {
    return user.id === currentUser.id || user.username === currentUser.username;
}

function sortUsers(users, currentUser) {
    return [...users].sort((a, b) => {
        if (isCurrentUser(a, currentUser)) return -1;
        if (isCurrentUser(b, currentUser)) return 1;
        if (a.is_sharing && !b.is_sharing) return -1;
        if (!a.is_sharing && b.is_sharing) return 1;
        return 0;
    });
}

function UserInfo({ user }) {
    return (
        <div className={styles.userInfo}>
            <div className={styles.avatar}>{user.first_name?.[0] || user.username[0]}</div>
            <div className={styles.userNameDetails}>
                <span className={styles.userFullName}>{user.first_name} {user.last_name}</span>
                <span className={styles.userHandle}>@{user.username}</span>
            </div>
        </div>
    );
}

function UserItem({ user, currentUser, onUserClick }) {
    const isSelf = isCurrentUser(user, currentUser);
    return (
        <div className={styles.userItem} onClick={() => onUserClick?.(user)}>
            <UserInfo user={user} />
            {!isSelf && <ShareButton userId={user.id} initialIsSharing={user.is_sharing} />}
        </div>
    );
}

function ModalHeader({ title, onClose }) {
    return (
        <div className={styles.modalHeader}>
            <h2>{title}</h2>
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
    );
}

function UserList({ users, currentUser, onUserClick }) {
    if (users.length === 0) return <p className={styles.emptyText}>No users found.</p>;
    return (
        <div className={styles.userList}>
            {users.map((u, i) => <UserItem key={u.id || u.username || i} user={u} currentUser={currentUser} onUserClick={onUserClick} />)}
        </div>
    );
}

export default function UserListModal({ title, users, onClose, onUserClick }) {
    if (!users) return null;
    const currentUser = getCurrentUser();
    const sortedUsers = sortUsers(users, currentUser);
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <ModalHeader title={title} onClose={onClose} />
                <UserList users={sortedUsers} currentUser={currentUser} onUserClick={onUserClick} />
            </div>
        </div>
    );
}
