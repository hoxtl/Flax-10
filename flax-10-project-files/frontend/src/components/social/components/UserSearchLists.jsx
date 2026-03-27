/*
 * Search results dropdown for the user search bar.
 */

import EmptyState from '../../common/empty_state/EmptyState';
import { UserResultItem } from './UserSearchItems';
import { SEARCH_EMPTY_CONFIG, styles } from '../utils/userSearchShared';

export function EmptySearchText({ icon, title, description }) {
    return (
        <div className={styles.emptyStateWrap}>
            <EmptyState icon={icon} title={title} description={description} />
        </div>
    );
}

function SearchResultsList({ results, onSelect, compact }) {
    return (
        <div className={styles.userList}>
            {results.map((user, index) => <UserResultItem key={user.id || index} user={user} onSelect={() => onSelect(user)} compact={compact} />)}
        </div>
    );
}

export function SearchDropdown({ loading, query, setQuery, userResults, onUserSelect, compact, renderEmptyState, dropdownMode = "overlay" }) {
    const showEmpty = !loading && userResults.length === 0;
    const customEmptyState = renderEmptyState?.({ query, clear: () => setQuery("") });
    if (compact && showEmpty && !query) return null;
    const modeClass = dropdownMode === "inline" ? styles.searchDropdownInline : "";
    return (
        <div className={`${styles.searchDropdownContainer} ${compact ? styles.compactDropdown : ''} ${modeClass}`}>
            {loading && <EmptySearchText {...SEARCH_EMPTY_CONFIG.loading} />}
            {showEmpty && query && (customEmptyState || <EmptySearchText {...SEARCH_EMPTY_CONFIG.users} />)}
            {showEmpty && !query && <EmptySearchText {...SEARCH_EMPTY_CONFIG.start} />}
            {!loading && userResults.length > 0 && <SearchResultsList results={userResults} onSelect={onUserSelect} compact={compact} />}
        </div>
    );
}
