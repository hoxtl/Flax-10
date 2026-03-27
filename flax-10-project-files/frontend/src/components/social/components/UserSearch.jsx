/*
 * Public user search component and legacy exports.
 */

import { useRef, useState } from 'react';
import { CourseResultItem, SocietyResultItem, UserResultItem } from './UserSearchItems';
import { FilterSection, GlobalSearchBar } from './UserSearchShell';
import { useClickOutside, useFilterState, useSearchInit, useSearchState } from '../hooks/userSearchHooks';
import { styles } from '../utils/userSearchShared';

export {
  CourseResultItem,
  SocietyResultItem,
  UserResultItem,
  useClickOutside,
  useFilterState,
  useSearchInit,
  FilterSection,
};

function getDisplayResults(filterUsers, userResults) {
  return filterUsers ? filterUsers(userResults) : userResults;
}

function handleUserSelect(user, onUserSelect, setIsSearchFocused, searchState) {
  onUserSelect?.(user);
  setIsSearchFocused(false);
  searchState.setQuery('');
}

function focusSearch(setIsSearchFocused, filterState) {
  setIsSearchFocused(true);
  filterState.setIsFilterOpen(false);
}

function toggleFilterPanel(setIsSearchFocused, filterState) {
  filterState.setIsFilterOpen(!filterState.isFilterOpen);
  setIsSearchFocused(false);
}

function buildSearchBarProps(p) {
  return {
    query: p.searchState.query,
    setQuery: p.searchState.setQuery,
    setFocus: () => focusSearch(p.setIsSearchFocused, p.filterState),
    containerRef: p.searchState.containerRef,
    showDropdown: p.filterState.active && (p.openOnEmptyQuery || Boolean(p.searchState.query.trim())),
    loading: p.searchState.loading,
    userResults: getDisplayResults(p.filterUsers, p.searchState.userResults),
    handleSelect: (user) => handleUserSelect(user, p.onUserSelect, p.setIsSearchFocused, p.searchState),
    fullWidth: p.fullWidth,
    compact: p.compact,
    renderEmptyState: p.renderEmptyState,
    placeholder: p.searchPlaceholder,
    dropdownMode: p.dropdownMode,
  };
}

function UserSearchLayout(p) {
  const toggleFilter = () => toggleFilterPanel(p.setIsSearchFocused, p.filterState);
  return (
    <div className={`${styles.userSearchWrapper} ${p.fullWidth ? styles.fullWidthWrapper : ''}`}>
      <GlobalSearchBar {...buildSearchBarProps(p)} />
      {!p.hideFilter && <FilterSection fRef={p.filterRef} isOpen={p.filterState.isFilterOpen} setOpen={toggleFilter} props={p.filterState.props} />}
    </div>
  );
}

export default function UserSearch({ onUserSelect, filterUsers, fullWidth, hideFilter, compact, renderEmptyState, searchPlaceholder = "Search users...", openOnEmptyQuery = true, dropdownMode = "overlay" }) {
  const searchState = useSearchState(hideFilter);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const filterRef = useRef(null);
  const filterState = useFilterState(searchState.allCourses, searchState.allSocieties, searchState.query, isSearchFocused, searchState.userResults, searchState.setUserResults, searchState.setLoading);
  useClickOutside(searchState.containerRef, () => setIsSearchFocused(false));
  useClickOutside(filterRef, () => filterState.setIsFilterOpen(false));
  return (
    <UserSearchLayout searchState={searchState} filterState={filterState} filterRef={filterRef} setIsSearchFocused={setIsSearchFocused}
      onUserSelect={onUserSelect} filterUsers={filterUsers} fullWidth={fullWidth} hideFilter={hideFilter} compact={compact}
      renderEmptyState={renderEmptyState} searchPlaceholder={searchPlaceholder} openOnEmptyQuery={openOnEmptyQuery} dropdownMode={dropdownMode}
    />
  );
}
