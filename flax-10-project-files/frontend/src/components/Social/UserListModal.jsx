import ShareButton from './ShareButton';
import GenericSummaryModal from '../common/GenericSummaryModal/GenericSummaryModal';
import SummaryItem from '../common/GenericSummaryModal/SummaryItem';
import UserAvatar from '../common/UserAvatar/UserAvatar';

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


function formatName(user) {
    const fn = user.first_name || '';
    const ln = user.last_name || '';
    return (fn || ln) ? `${fn} ${ln}`.trim() : user.username;
}

export default function UserListModal({ title, users, onClose, onUserClick, onUserUpdate }) {
    if (!users) return null;
    const currentUser = getCurrentUser();
    const sortedUsers = sortUsers(users, currentUser);

    return (
        <GenericSummaryModal
            isOpen={true}
            onClose={onClose}
            title={title}
            emptyMessage="No users found"
            emptyIcon="👥"
            emptyDescription="No one is sharing with you yet"
            items={sortedUsers}
            renderItem={(u, i) => {
                const isSelf = isCurrentUser(u, currentUser);
                return (
                    <SummaryItem
                        key={u.id || u.username || i}
                        avatar={<UserAvatar user={u} avatarOnly />}
                        title={formatName(u)}
                        subtitle={`@${u.username}`}
                        onClick={() => onUserClick?.(u)}
                        rightAction={!isSelf ? <ShareButton userId={u.id} initialIsSharing={u.is_sharing} onToggle={onUserUpdate} /> : null}
                    />
                );
            }}
        />
    );
}
