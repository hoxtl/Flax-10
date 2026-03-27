/*
 * Top-level user search shell components.
 */

import { AnimatePresence, motion } from "framer-motion";
import SearchBar from '../../common/search_bar/SearchBar';
import { SearchDropdown } from './UserSearchLists';
import { FilterDropdown } from './FilterDropdown';
import { styles } from '../utils/userSearchShared';

export function GlobalSearchBar({ query, setQuery, setFocus, containerRef, showDropdown, loading, userResults, handleSelect, fullWidth, compact, renderEmptyState, placeholder = "Search users...", dropdownMode = "overlay" }) {
    const widthClass = fullWidth ? styles.fullWidthSearch : '';
    const searchClass = fullWidth ? styles.searchBarFull : styles.searchBarContainer;
    return (
        <div className={`${styles.searchContainer} ${styles.relativeContainer} ${widthClass}`} ref={containerRef}>
            <SearchBar value={query} onChange={setQuery} onFocus={setFocus} placeholder={placeholder} className={searchClass} />
            {showDropdown && <SearchDropdown loading={loading} query={query} setQuery={setQuery} userResults={userResults} onUserSelect={handleSelect} compact={compact} renderEmptyState={renderEmptyState} dropdownMode={dropdownMode} />}
        </div>
    );
}

export function FilterSection({ fRef, isOpen, setOpen, onOpen, onClose, props }) {
    return (
        <div ref={fRef} className={styles.relativeContainer} onMouseEnter={onOpen} onMouseLeave={onClose}>
            <button onClick={setOpen} className={styles.filterBtn}><FilterIcon /> Filter</button>
            <AnimatePresence>{isOpen && <FilterDropdownMotion {...props} />}</AnimatePresence>
        </div>
    );
}

const FILTER_DROPDOWN_STYLE = { originY: 0, originX: 1, position: 'relative', zIndex: 10000 };

function FilterDropdownMotion(props) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={FILTER_DROPDOWN_STYLE}
        >
            <FilterDropdown {...props} />
        </motion.div>
    );
}

function FilterIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}
