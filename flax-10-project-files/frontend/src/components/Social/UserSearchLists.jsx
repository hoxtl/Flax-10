/*
 * User search dropdown and filter list UI.
 */

import React from 'react';
import EmptyState from '../common/EmptyState/EmptyState';
import SearchBar from '../common/SearchBar/SearchBar';
import { CourseResultItem, RoleResultItem, SocietyResultItem, UserResultItem, YearResultItem } from './UserSearchItems';
import { FILTER_TABS, SEARCH_EMPTY_CONFIG, styles } from './userSearchShared';
import { getSocietyCategories, matchCat } from './userSearchUtils';

function EmptySearchText({ icon, title, description }) {
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

function getSearchPlaceholder(tab) {
    if (tab === 'courses') return 'Search courses or departments...';
    if (tab === 'years') return 'Search years...';
    if (tab === 'roles') return 'Search roles...';
    return 'Search societies...';
}

function FilterTabs({ activeTab, setTab }) {
    return (
        <div className={styles.filterTabs}>
            {FILTER_TABS.map((tab) => <FilterTab key={tab.value} tab={tab} activeTab={activeTab} setTab={setTab} />)}
        </div>
    );
}

function FilterTab({ tab, activeTab, setTab }) {
    const activeClass = activeTab === tab.value ? styles.filterTabActive : '';
    const onClick = (event) => {
        event.preventDefault();
        setTab(tab.value);
    };
    return <button onClick={onClick} className={`${styles.filterTab} ${activeClass}`}>{tab.label}</button>;
}

function FilterSearchInput({ query, setQuery, tab }) {
    return <SearchBar value={query} onChange={setQuery} placeholder={getSearchPlaceholder(tab)} />;
}

function ExpandBtn({ count, isExpanded, sectionKey, toggle }) {
    if (count <= 5) return null;
    const label = isExpanded ? 'Show less' : `+ ${count - 5} more`;
    const activeClass = isExpanded ? styles.collapseButton : '';
    return <button onClick={() => toggle(sectionKey)} className={`${styles.expandButton} ${activeClass}`}>{label}</button>;
}

function GroupList({ items, isExpanded, renderItem, toggle, sectionKey }) {
    const visibleItems = isExpanded ? items : items.slice(0, 5);
    return (
        <div className={styles.userList} style={{ gap: 0 }}>
            {visibleItems.map(renderItem)}
            <ExpandBtn count={items.length} isExpanded={isExpanded} sectionKey={sectionKey} toggle={toggle} />
        </div>
    );
}

function GroupedSection({ title, items, expanded, renderItem, toggle, sectionKey, capitalize }) {
    if (items.length === 0) return null;
    const titleClass = capitalize ? `${styles.groupHeading} ${styles.groupHeadingCapitalize}` : styles.groupHeading;
    return (
        <div>
            <h4 className={titleClass}>{title}</h4>
            <GroupList items={items} isExpanded={expanded[sectionKey]} renderItem={renderItem} toggle={toggle} sectionKey={sectionKey} />
        </div>
    );
}

function FlatCourseList({ courses, querySelected, onToggle }) {
    return <div className={`${styles.userList} ${styles.userListNoGap}`}>{courses.map((course) => <CourseResultItem key={course} course={course} isChecked={querySelected(course)} onToggle={onToggle} />)}</div>;
}

function GroupedCourseList({ courseGroups, querySelected, onToggle, expanded, toggleSection }) {
    return (
        <div className={styles.groupContainer}>
            {Object.entries(courseGroups).map(([department, courses]) => <GroupedSection key={department} title={department} items={courses} expanded={expanded} renderItem={(course) => <CourseResultItem key={course} course={course} isChecked={querySelected(course)} onToggle={onToggle} />} toggle={toggleSection} sectionKey={`course_${department}`} />)}
        </div>
    );
}

function CourseList({ courseGroups, filteredCourses, filterQuery, querySelected, onToggle, expanded, toggleSection }) {
    if (filteredCourses.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.courses} />;
    if (filterQuery) return <FlatCourseList courses={filteredCourses} querySelected={querySelected} onToggle={onToggle} />;
    return <GroupedCourseList courseGroups={courseGroups} querySelected={querySelected} onToggle={onToggle} expanded={expanded} toggleSection={toggleSection} />;
}

function YearList({ years, querySelected, onToggle }) {
    if (years.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.years} />;
    return <div className={`${styles.userList} ${styles.userListNoGap}`}>{years.map((year) => <YearResultItem key={year} year={year} isChecked={querySelected(year)} onToggle={onToggle} />)}</div>;
}

function RoleList({ roles, querySelected, onToggle }) {
    if (roles.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.roles} />;
    return <div className={`${styles.userList} ${styles.userListNoGap}`}>{roles.map((role) => <RoleResultItem key={role.value} role={role} isChecked={querySelected(role.value)} onToggle={onToggle} />)}</div>;
}

function FlatSocietyList({ societies, querySelected, onToggle }) {
    return <div className={`${styles.userList} ${styles.userListNoGap}`}>{societies.map((society) => <SocietyResultItem key={society.id} society={society} isChecked={querySelected(society.id)} onToggle={onToggle} />)}</div>;
}

function SocietyCategorySection({ category, societies, querySelected, onToggle, expanded, toggleSection }) {
    const items = societies.filter((society) => matchCat(society, category));
    const renderItem = (society) => <SocietyResultItem key={society.id} society={society} isChecked={querySelected(society.id)} onToggle={onToggle} />;
    return <GroupedSection title={category} items={items} expanded={expanded} renderItem={renderItem} toggle={toggleSection} sectionKey={`soc_${category}`} capitalize />;
}

function GroupedSocietyList({ societies, querySelected, onToggle, expanded, toggleSection }) {
    const categories = getSocietyCategories(societies);
    return (
        <div className={styles.groupContainer}>
            {categories.map((category) => <SocietyCategorySection key={category} category={category} societies={societies} querySelected={querySelected} onToggle={onToggle} expanded={expanded} toggleSection={toggleSection} />)}
        </div>
    );
}

function SocietyList({ societies, filterQuery, querySelected, onToggle, expanded, toggleSection }) {
    if (societies.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.societies} />;
    if (filterQuery) return <FlatSocietyList societies={societies} querySelected={querySelected} onToggle={onToggle} />;
    return <GroupedSocietyList societies={societies} querySelected={querySelected} onToggle={onToggle} expanded={expanded} toggleSection={toggleSection} />;
}

export function SearchDropdown({ loading, query, setQuery, userResults, onUserSelect, compact, renderEmptyState }) {
    const showEmpty = !loading && userResults.length === 0;
    const customEmptyState = renderEmptyState?.({
        query,
        clear: () => setQuery(""),
    });
    if (compact && showEmpty && !query) return null;
    return (
        <div className={`${styles.searchDropdownContainer} ${compact ? styles.compactDropdown : ''}`}>
            {loading && <EmptySearchText {...SEARCH_EMPTY_CONFIG.loading} />}
            {showEmpty && query && (customEmptyState || <EmptySearchText {...SEARCH_EMPTY_CONFIG.users} />)}
            {showEmpty && !query && <EmptySearchText {...SEARCH_EMPTY_CONFIG.start} />}
            {!loading && userResults.length > 0 && <SearchResultsList results={userResults} onSelect={onUserSelect} compact={compact} />}
        </div>
    );
}

function FilterListContainer(props) {
    return <div className={styles.filterListContainer}>{renderActiveFilterList(props)}</div>;
}

function renderActiveFilterList(props) {
    if (props.activeFilterTab === 'courses') return <CourseList courseGroups={props.courseGroups} filteredCourses={props.courseResults} filterQuery={props.filterQuery} querySelected={(course) => props.selectedCourses.includes(course)} onToggle={props.toggleCourse} expanded={props.expanded} toggleSection={props.toggleSection} />;
    if (props.activeFilterTab === 'years') return <YearList years={props.yearResults} querySelected={(year) => props.selectedYears.includes(year)} onToggle={props.toggleYear} />;
    if (props.activeFilterTab === 'roles') return <RoleList roles={props.roleResults} querySelected={(role) => props.selectedRoles.includes(role)} onToggle={props.toggleRole} />;
    return <SocietyList societies={props.societyResults} filterQuery={props.filterQuery} querySelected={(id) => props.selectedSocieties.includes(id)} onToggle={props.toggleSociety} expanded={props.expanded} toggleSection={props.toggleSection} />;
}

export function FilterDropdown(props) {
    const [expanded, setExpanded] = React.useState({});
    const toggleSection = (key) => setExpanded((current) => ({ ...current, [key]: !current[key] }));
    const listProps = buildFilterListProps(props, expanded, toggleSection);
    return <FilterDropdownBody activeFilterTab={props.activeFilterTab} setActiveFilterTab={props.setActiveFilterTab} filterQuery={props.filterQuery} setFilterQuery={props.setFilterQuery} listProps={listProps} />;
}

function FilterDropdownBody({ activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery, listProps }) {
    return (
        <div className={styles.filterDropdown} onClick={(event) => event.stopPropagation()}>
            <FilterTabs activeTab={activeFilterTab} setTab={setActiveFilterTab} />
            <FilterSearchInput query={filterQuery} setQuery={setFilterQuery} tab={activeFilterTab} />
            <FilterListContainer {...listProps} />
        </div>
    );
}

function buildFilterListProps(props, expanded, toggleSection) {
    return {
        activeFilterTab: props.activeFilterTab,
        courseGroups: props.courseGroups,
        courseResults: props.courseResults,
        selectedCourses: props.selectedCourses,
        toggleCourse: props.toggleCourse,
        yearResults: props.yearResults,
        selectedYears: props.selectedYears,
        toggleYear: props.toggleYear,
        roleResults: props.roleResults,
        selectedRoles: props.selectedRoles,
        toggleRole: props.toggleRole,
        societyResults: props.societyResults,
        selectedSocieties: props.selectedSocieties,
        toggleSociety: props.toggleSociety,
        filterQuery: props.filterQuery, expanded, toggleSection,
    };
}
