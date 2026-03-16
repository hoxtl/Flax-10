import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { searchUsers } from '../../api/userService';
import { fetchSocieties } from '../../api/societyApi';
import { KCL_DEPARTMENTS } from '../../lib/kclCourses';
import socialStyles from './Social.module.css';
import searchStyles from './UserSearch.module.css';
import SearchBar from '../common/SearchBar/SearchBar';
import UserAvatar from '../common/UserAvatar/UserAvatar';
import EmptyState from '../common/EmptyState/EmptyState';
const styles = { ...socialStyles, ...searchStyles };
const YEAR_OPTIONS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];
const ROLE_OPTIONS = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Professor" },
];

function handleErr(label, error, setter) {
    // Keep the search UI resilient even if the filter sources fail.
    console.error(label, error);
    setter([]);
}

async function fetchUserResults(query, courses, socs, years, roles, setRes, setL) {
    const safeSetResults = typeof setRes === "function" ? setRes : () => { };
    const safeSetLoading = typeof setL === "function" ? setL : () => { };
    if (!query.trim() && !courses.trim() && !socs.trim() && !years.trim() && !roles.trim()) return safeSetResults([]);
    safeSetLoading(true);
    const data = await searchUsers(query, courses, socs, 0, 20, years, roles).catch(() => []);
    safeSetResults(data.results || data);
    safeSetLoading(false);
}

export function useClickOutside(ref, onOutside) {
    useEffect(() => {
        const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onOutside]);
}

export const useSearchInit = (skip) => {
    const [allSocieties, setAllSocieties] = useState([]);
    useEffect(() => {
        if (!skip) fetchSocieties().then(res => setAllSocieties(res.results || res)).catch(e => handleErr("Societies error", e, setAllSocieties));
    }, [skip]);
    return { allCourses: KCL_DEPARTMENTS, allSocieties };
};

function useSearchState(skip) {
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const { allCourses, allSocieties } = useSearchInit(skip);
    return { query, setQuery, userResults, setUserResults, allCourses, allSocieties, loading, setLoading, containerRef };
}


export function UserResultItem({ user, onSelect, compact }) {
    const displayName = (user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'User');
    return (
        <div className={`${styles.userItem} ${styles.userResultItem} ${compact ? styles.compactUserItem : ''}`} onClick={onSelect}>
            <UserAvatar user={user} avatarOnly />
            <div className={styles.userNameDetails}>
                {!compact && <span className={styles.userFullName}>{displayName}</span>}
                <span className={styles.userHandle}>{compact ? user.username : `@${user.username}`}</span>
            </div>
        </div>
    );
}

const FilterCheckbox = ({ isChecked, onToggle, id }) => (
    <input type="checkbox" checked={isChecked} onChange={() => onToggle(id)} className={styles.filterItemCheckbox} onClick={(e) => e.stopPropagation()} />
);

export function CourseResultItem({ course, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(course)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={course} />
            <div className={styles.filterItemText}>
                <span className={styles.filterItemTitle}>{course}</span>
            </div>
        </div>
    );
}

const SText = ({ s }) => (
    <div className={styles.filterItemText}>
        <span className={styles.filterItemTitle}>{s.name}</span>
    </div>
);

export function SocietyResultItem({ society, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(society.id)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={society.id} />
            <SText s={society} />
        </div>
    );
}

const getSocietyCategories = (societies) => Array.from(new Set(societies.map(s => s.categories?.[0]?.toLowerCase() || 'other'))).sort();

const SEARCH_EMPTY_CONFIG = {
    loading: { icon: '⏳', title: 'Searching users', description: 'Matching profiles will appear here.' },
    users: { icon: '🔎', title: 'No users found', description: 'Try a different name or filter.' },
    start: { icon: '👋', title: 'Start typing', description: 'Search by name, username, course, or society.' },
    courses: { icon: '📚', title: 'No courses found', description: 'Try a different course search.' },
    years: { icon: '🗓️', title: 'No years found', description: 'Try a different year search.' },
    roles: { icon: '🧑‍🏫', title: 'No roles found', description: 'Try selecting a different role.' },
    societies: { icon: '🎭', title: 'No societies found', description: 'Try a different society search.' },
};

const EmptySearchText = ({ icon, title, description }) => (
    <div className={styles.emptyStateWrap}>
        <EmptyState icon={icon} title={title} description={description} />
    </div>
);

const SearchResultsList = ({ results, onSelect, compact }) => (
    <div className={styles.userList}>
        {results.map((u, i) => <UserResultItem key={u.id || i} user={u} onSelect={() => onSelect(u)} compact={compact} />)}
    </div>
);

function SearchDropdown({ loading, query, userResults, onUserSelect, compact }) {
    const showEmpty = !loading && userResults.length === 0;
    if (compact && showEmpty && !query) return null;
    return (
        <div className={`${styles.searchDropdownContainer} ${compact ? styles.compactDropdown : ''}`}>
            {loading && <EmptySearchText {...SEARCH_EMPTY_CONFIG.loading} />}
            {showEmpty && query && <EmptySearchText {...SEARCH_EMPTY_CONFIG.users} />}
            {showEmpty && !query && <EmptySearchText {...SEARCH_EMPTY_CONFIG.start} />}
            {!loading && userResults.length > 0 && <SearchResultsList results={userResults} onSelect={onUserSelect} compact={compact} />}
        </div>
    );
}

const FILTER_TABS = [
    { value: 'roles', label: 'Role' },
    { value: 'courses', label: 'Courses' },
    { value: 'years', label: 'Year' },
    { value: 'societies', label: 'Societies' },
];

const FilterTabs = ({ activeTab, setTab }) => (
    <div className={styles.filterTabs}>
        {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={(e) => { e.preventDefault(); setTab(tab.value); }} className={`${styles.filterTab} ${activeTab === tab.value ? styles.filterTabActive : ''}`}>{tab.label}</button>
        ))}
    </div>
);

const FilterSearchInput = ({ query, setQuery, tab }) => (
    <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={tab === 'courses'
            ? 'Search courses or departments...'
            : tab === 'years'
                ? 'Search years...'
                : tab === 'roles'
                    ? 'Search roles...'
                    : 'Search societies...'}
    />
);

const ExpandBtn = ({ count, isExpanded, sectionKey, toggle }) => (
    count > 5 && (
        <button onClick={() => toggle(sectionKey)} className={`${styles.expandButton} ${isExpanded ? styles.collapseButton : ''}`}>{isExpanded ? 'Show less' : `+ ${count - 5} more`}</button>
    )
);

const GroupList = ({ items, isExpanded, renderItem, toggle, sectionKey }) => (
    <div className={styles.userList} style={{ gap: 0 }}>
        {(isExpanded ? items : items.slice(0, 5)).map(renderItem)}
        <ExpandBtn count={items.length} isExpanded={isExpanded} sectionKey={sectionKey} toggle={toggle} />
    </div>
);

const GroupedSection = ({ title, items, expanded, renderItem, toggle, sectionKey, capitalize }) => {
    if (items.length === 0) return null;
    const titleClass = `${styles.groupHeading} ${capitalize ? styles.groupHeadingCapitalize : ''}`;
    return (
        <div key={title}>
            <h4 className={titleClass}>{title}</h4>
            <GroupList items={items} isExpanded={expanded[sectionKey]} renderItem={renderItem} toggle={toggle} sectionKey={sectionKey} />
        </div>
    );
};

const CourseList = ({ courseGroups, filteredCourses, filterQuery, querySelected, onToggle, expanded, toggleSection }) => {
    if (filteredCourses.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.courses} />;
    const renderItem = (course) => <CourseResultItem key={course} course={course} isChecked={querySelected(course)} onToggle={onToggle} />;
    if (filterQuery) return <div className={`${styles.userList} ${styles.userListNoGap}`}>{filteredCourses.map(renderItem)}</div>;
    return (
        <div className={styles.groupContainer}>
            {Object.entries(courseGroups).map(([department, courses]) => (
                <GroupedSection
                    key={department}
                    title={department}
                    items={courses}
                    expanded={expanded}
                    renderItem={renderItem}
                    toggle={toggleSection}
                    sectionKey={`course_${department}`}
                />
            ))}
        </div>
    );
};

const YearResultItem = ({ year, isChecked, onToggle }) => (
    <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(year)}>
        <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={year} />
        <div className={styles.filterItemText}>
            <span className={styles.filterItemTitle}>{year}</span>
        </div>
    </div>
);

const YearList = ({ years, querySelected, onToggle }) => {
    if (years.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.years} />;
    return (
        <div className={`${styles.userList} ${styles.userListNoGap}`}>
            {years.map((year) => (
                <YearResultItem key={year} year={year} isChecked={querySelected(year)} onToggle={onToggle} />
            ))}
        </div>
    );
};

const RoleResultItem = ({ role, isChecked, onToggle }) => (
    <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(role.value)}>
        <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={role.value} />
        <div className={styles.filterItemText}>
            <span className={styles.filterItemTitle}>{role.label}</span>
        </div>
    </div>
);

const RoleList = ({ roles, querySelected, onToggle }) => {
    if (roles.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.roles} />;
    return (
        <div className={`${styles.userList} ${styles.userListNoGap}`}>
            {roles.map((role) => (
                <RoleResultItem key={role.value} role={role} isChecked={querySelected(role.value)} onToggle={onToggle} />
            ))}
        </div>
    );
};

const matchCat = (s, cat) => cat === 'other' ? (!s.categories || !s.categories.length) : (s.categories?.[0]?.toLowerCase() === cat);
const SocietyList = ({ societies, filterQuery, querySelected, onToggle, cats, expanded, toggleSection }) => {
    if (societies.length === 0) return <EmptySearchText {...SEARCH_EMPTY_CONFIG.societies} />;
    const rItem = s => <SocietyResultItem key={s.id} society={s} isChecked={querySelected(s.id)} onToggle={onToggle} />;
    if (filterQuery) return <div className={`${styles.userList} ${styles.userListNoGap}`}>{societies.map(rItem)}</div>;
    return (
        <div className={styles.groupContainer}>
            {cats.map(c => <GroupedSection key={c} title={c} items={societies.filter(s => matchCat(s, c))} expanded={expanded} renderItem={rItem} toggle={toggleSection} sectionKey={`soc_${c}`} capitalize />)}
        </div>
    );
};

function FilterDropdown({
    activeFilterTab: tab,
    setActiveFilterTab: setT,
    filterQuery: q,
    setFilterQuery: setQ,
    courseGroups,
    courseResults,
    selectedCourses: sC,
    toggleCourse: tC,
    yearResults: yR,
    selectedYears: sY,
    toggleYear: tY,
    roleResults: rR,
    selectedRoles: sRls,
    toggleRole: tR,
    societyResults: sR,
    selectedSocieties: sS,
    toggleSociety: tS,
}) {
    const [expanded, setExpanded] = useState({});
    const cats = getSocietyCategories(sR);
    const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));
    return (
        <div className={styles.filterDropdown} onClick={(e) => e.stopPropagation()}>
            <FilterTabs activeTab={tab} setTab={setT} />
            <FilterSearchInput query={q} setQuery={setQ} tab={tab} />
            <div className={styles.filterListContainer}>
                {tab === 'courses' && <CourseList courseGroups={courseGroups} filteredCourses={courseResults} filterQuery={q} querySelected={course => sC.includes(course)} onToggle={tC} expanded={expanded} toggleSection={toggle} />}
                {tab === 'years' && <YearList years={yR} querySelected={year => sY.includes(year)} onToggle={tY} />}
                {tab === 'roles' && <RoleList roles={rR} querySelected={role => sRls.includes(role)} onToggle={tR} />}
                {tab === 'societies' && <SocietyList societies={sR} filterQuery={q} querySelected={id => sS.includes(id)} onToggle={tS} cats={cats} expanded={expanded} toggleSection={toggle} />}
            </div>
        </div>
    );
}

const filterObj = (objs, q, keys) => objs.filter(o => !q ? true : keys.some(k => (o[k] || '').toLowerCase().includes(q.toLowerCase())));
const filterCourses = (courseGroups, q) => {
    const query = q.trim().toLowerCase();
    if (!query) return courseGroups;
    return Object.fromEntries(
        Object.entries(courseGroups)
            .map(([department, courses]) => [
                department,
                department.toLowerCase().includes(query)
                    ? courses
                    : courses.filter((course) => course.toLowerCase().includes(query)),
            ])
            .filter(([, courses]) => courses.length > 0)
    );
};
const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

function GlobalSearchBar({ query, setQuery, setFocus, containerRef, showDpdwn, loading, userResults, handleSel, fullWidth, compact }) {
    const onFocus = () => setFocus();
    return (
        <div className={`${styles.searchContainer} ${styles.relativeContainer} ${fullWidth ? styles.fullWidthSearch : ''}`} ref={containerRef}>
            <SearchBar value={query} onChange={setQuery} onFocus={onFocus} placeholder="Search users..." className={fullWidth ? styles.searchBarFull : styles.searchBarContainer} />
            {showDpdwn && <SearchDropdown loading={loading} query={query} userResults={userResults} onUserSelect={handleSel} compact={compact} />}
        </div>
    );
}

const useUserSearchEffects = (query, selectedCourses, selectedSocieties, selectedYears, selectedRoles, setUserResults, setLoading) => {
    useEffect(() => {
        const timer = setTimeout(() => fetchUserResults(
            query,
            selectedCourses.join(','),
            selectedSocieties.join(','),
            selectedYears.join(','),
            selectedRoles.join(','),
            setUserResults,
            setLoading
        ), 300);
        return () => clearTimeout(timer);
    }, [query, selectedCourses, selectedSocieties, selectedYears, selectedRoles]);
};

export const FilterSection = ({ fRef, isOpen, setOpen, props }) => (
    <div ref={fRef} className={styles.relativeContainer}>
        <button onClick={setOpen} className={styles.filterBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg> Filter</button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    style={{ originY: 0, originX: 1, position: 'relative', zIndex: 10000 }}
                >
                    <FilterDropdown {...props} />
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export const useFilterState = (allCourses, allSocieties, query, isSearchFocused, userResults, setUserResults, setLoading) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('courses');
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [selectedYears, setSelectedYears] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedSocieties, setSelectedSocieties] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');
    const togCourse = (course) => setSelectedCourses(p => toggleArr(p, course));
    const togYear = (year) => setSelectedYears(p => toggleArr(p, year));
    const togRole = (role) => setSelectedRoles(p => toggleArr(p, role));
    const togSoc = (id) => setSelectedSocieties(p => toggleArr(p, id));
    useUserSearchEffects(query, selectedCourses, selectedSocieties, selectedYears, selectedRoles, setUserResults, setLoading);
    const active = isSearchFocused;
    const filteredCourseGroups = filterCourses(allCourses, filterQuery);
    const props = {
        activeFilterTab,
        setActiveFilterTab,
        filterQuery,
        setFilterQuery,
        courseGroups: filteredCourseGroups,
        courseResults: Object.values(filteredCourseGroups).flat(),
        selectedCourses,
        selectedYears,
        selectedRoles,
        toggleCourse: togCourse,
        yearResults: YEAR_OPTIONS.filter((year) => !filterQuery || year.toLowerCase().includes(filterQuery.toLowerCase())),
        toggleYear: togYear,
        roleResults: ROLE_OPTIONS.filter((role) => !filterQuery || role.label.toLowerCase().includes(filterQuery.toLowerCase())),
        toggleRole: togRole,
        societyResults: filterObj(allSocieties, filterQuery, ['name']),
        selectedSocieties,
        toggleSociety: togSoc,
    };
    return { isFilterOpen, setIsFilterOpen, active, props };
};

export default function UserSearch({ onUserSelect, filterUsers, fullWidth, hideFilter, compact }) {
    const { query, setQuery, userResults, setUserResults, allCourses: aC, allSocieties: aS, loading, setLoading, containerRef } = useSearchState(hideFilter);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const filterRef = useRef(null);
    const { isFilterOpen, setIsFilterOpen, active, props } = useFilterState(aC, aS, query, isSearchFocused, userResults, setUserResults, setLoading);
    useClickOutside(containerRef, () => setIsSearchFocused(false));
    useClickOutside(filterRef, () => setIsFilterOpen(false));
    const handleS = (u) => { onUserSelect?.(u); setIsSearchFocused(false); setQuery(''); };
    const onSetFocus = () => { setIsSearchFocused(true); setIsFilterOpen(false); };
    const onToggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSearchFocused(false); };

    const displayResults = filterUsers ? filterUsers(userResults) : userResults;

    return (
        <div className={`${styles.userSearchWrapper} ${fullWidth ? styles.fullWidthWrapper : ''}`}>
            <GlobalSearchBar query={query} setQuery={setQuery} setFocus={onSetFocus} containerRef={containerRef} showDpdwn={active} loading={loading} userResults={displayResults} handleSel={handleS} fullWidth={fullWidth} compact={compact} />
            {!hideFilter && <FilterSection fRef={filterRef} isOpen={isFilterOpen} setOpen={onToggleFilter} props={props} />}
        </div>
    );
}
