/*
 * Modal for showing and interacting with a list of users.
 */

import ShareButton from './ShareButton';
import GenericSummaryModal from '../common/GenericSummaryModal/GenericSummaryModal';
import SearchEmptyState from '../common/SearchEmptyState/SearchEmptyState';
import SummaryItem from '../common/GenericSummaryModal/SummaryItem';
import UserAvatar from '../common/UserAvatar/UserAvatar';
import { getResolvedUserPhoto } from '../../utils/tutorPhotoFallback';

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user')) || {};
}

function isCurrentUser(user, currentUser) {
    return user.id === currentUser.id || user.username === currentUser.username;
}

function sortUsers(users, currentUser) {
    return [...users].sort((left, right) => {
        if (isCurrentUser(left, currentUser)) return -1;
        if (isCurrentUser(right, currentUser)) return 1;
        if (left.is_sharing && !right.is_sharing) return -1;
        if (!left.is_sharing && right.is_sharing) return 1;
        return 0;
    });
}

function formatName(user) {
    const fn = user.first_name || '';
    const ln = user.last_name || '';
    return (fn || ln) ? `${fn} ${ln}`.trim() : user.username;
}

function buildRenderItem(currentUser, onUserClick, onUserUpdate) {
    return (user, index) => <UserListItem key={user.id || user.username || index} user={user} currentUser={currentUser} onUserClick={onUserClick} onUserUpdate={onUserUpdate} />;
}

function UserListItem({ user, currentUser, onUserClick, onUserUpdate }) {
    const isSelf = isCurrentUser(user, currentUser);
    const rightAction = isSelf ? null : <ShareButton userId={user.id} initialIsSharing={user.is_sharing} onToggle={onUserUpdate} />;
    const avatarUser = { ...user, profile_photo_url: getResolvedUserPhoto(user, { allowGeneric: true }) };
    return <SummaryItem avatar={<UserAvatar user={avatarUser} avatarOnly />} title={formatName(user)} subtitle={`@${user.username}`} onClick={() => onUserClick?.(user)} rightAction={rightAction} />;
}

export default function UserListModal({ title, users, onClose, onUserClick, onUserUpdate }) {
    if (!users) return null;
    const currentUser = getCurrentUser();
    const items = sortUsers(users, currentUser);
    const renderItem = buildRenderItem(currentUser, onUserClick, onUserUpdate);
    return (
        <GenericSummaryModal
            isOpen={true}
            onClose={onClose}
            title={title}
            emptyContent={
                <SearchEmptyState
                    itemLabel="users"
                    title="No users found"
                    hint="No one is sharing with you yet."
                />
            }
            items={items}
            renderItem={renderItem}
        />
    );
}
