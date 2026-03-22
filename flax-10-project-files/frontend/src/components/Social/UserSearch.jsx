/*
 * Public user search component and legacy exports.
 */

import { useRef, useState } from 'react';
import { CourseResultItem, SocietyResultItem, UserResultItem } from './UserSearchItems';
import { FilterSection, GlobalSearchBar } from './UserSearchShell';
import { useClickOutside, useFilterState, useSearchInit, useSearchState } from './userSearchHooks';
import { styles } from './userSearchShared';

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

function UserSearchLayout({
  searchState,
  filterState,
  filterRef,
  setIsSearchFocused,
  onUserSelect,
  filterUsers,
  fullWidth,
  hideFilter,
  compact,
  renderEmptyState,
  searchPlaceholder,
  openOnEmptyQuery,
  dropdownMode,
}) {
  const handleSelect = (user) =>
    handleUserSelect(user, onUserSelect, setIsSearchFocused, searchState);

  const setFocus = () => focusSearch(setIsSearchFocused, filterState);
  const toggleFilter = () => toggleFilterPanel(setIsSearchFocused, filterState);
  const displayResults = getDisplayResults(filterUsers, searchState.userResults);
  const shouldShowDropdown = filterState.active && (openOnEmptyQuery || Boolean(searchState.query.trim()));

  return (
    <div className={`${styles.userSearchWrapper} ${fullWidth ? styles.fullWidthWrapper : ''}`}>
      <GlobalSearchBar
        query={searchState.query}
        setQuery={searchState.setQuery}
        setFocus={setFocus}
        containerRef={searchState.containerRef}
        showDropdown={shouldShowDropdown}
        loading={searchState.loading}
        userResults={displayResults}
        handleSelect={handleSelect}
        fullWidth={fullWidth}
        compact={compact}
        renderEmptyState={renderEmptyState}
        placeholder={searchPlaceholder}
        dropdownMode={dropdownMode}
      />
      {!hideFilter && (
        <FilterSection
          fRef={filterRef}
          isOpen={filterState.isFilterOpen}
          setOpen={toggleFilter}
          props={filterState.props}
        />
      )}
    </div>
  );
}

export default function UserSearch({
  onUserSelect,
  filterUsers,
  fullWidth,
  hideFilter,
  compact,
  renderEmptyState,
  searchPlaceholder = "Search users...",
  openOnEmptyQuery = true,
  dropdownMode = "overlay",
}) {
  const searchState = useSearchState(hideFilter);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const filterRef = useRef(null);

  const filterState = useFilterState(
    searchState.allCourses,
    searchState.allSocieties,
    searchState.query,
    isSearchFocused,
    searchState.userResults,
    searchState.setUserResults,
    searchState.setLoading
  );

  useClickOutside(searchState.containerRef, () => setIsSearchFocused(false));
  useClickOutside(filterRef, () => filterState.setIsFilterOpen(false));

  return (
    <UserSearchLayout
      searchState={searchState}
      filterState={filterState}
      filterRef={filterRef}
      setIsSearchFocused={setIsSearchFocused}
      onUserSelect={onUserSelect}
      filterUsers={filterUsers}
      fullWidth={fullWidth}
      hideFilter={hideFilter}
      compact={compact}
      renderEmptyState={renderEmptyState}
      searchPlaceholder={searchPlaceholder}
      openOnEmptyQuery={openOnEmptyQuery}
      dropdownMode={dropdownMode}
    />
  );
}
