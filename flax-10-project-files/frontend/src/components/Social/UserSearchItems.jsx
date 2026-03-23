/*
 * Reusable user search result and filter item components.
 */

import UserAvatar from '../common/UserAvatar/UserAvatar';
import { styles } from './userSearchShared';

function getDisplayName(user) {
    return user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User';
}

function FilterCheckbox({ isChecked, onToggle, id }) {
    const stopClick = (event) => event.stopPropagation();
    return (
        <input
            type="checkbox"
            checked={isChecked}
            onChange={() => onToggle(id)}
            className={styles.filterItemCheckbox}
            onClick={stopClick}
        />
    );
}

function FilterText({ title }) {
    return (
        <div className={styles.filterItemText}>
            <span className={styles.filterItemTitle}>{title}</span>
        </div>
    );
}

export function UserResultItem({ user, onSelect, compact }) {
    const displayName = getDisplayName(user);
    const compactClass = compact ? styles.compactUserItem : '';
    return (
        <div className={`${styles.userItem} ${styles.userResultItem} ${compactClass}`} onClick={onSelect}>
            <UserAvatar user={user} avatarOnly size={compact ? 42 : 44} allowGenericFallback />
            <div className={styles.userNameDetails}>
                {!compact && <span className={styles.userFullName}>{displayName}</span>}
                <span className={styles.userHandle}>{compact ? user.username : `@${user.username}`}</span>
            </div>
        </div>
    );
}

export function CourseResultItem({ course, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(course)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={course} />
            <FilterText title={course} />
        </div>
    );
}

export function SocietyResultItem({ society, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(society.id)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={society.id} />
            <FilterText title={society.name} />
        </div>
    );
}

export function YearResultItem({ year, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(year)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={year} />
            <FilterText title={year} />
        </div>
    );
}

export function RoleResultItem({ role, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(role.value)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={role.value} />
            <FilterText title={role.label} />
        </div>
    );
}
