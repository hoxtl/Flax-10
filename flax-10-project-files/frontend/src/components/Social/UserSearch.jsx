import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '../../api/userService';
import { getModules } from '../../api/moduleApi';
import { fetchSocieties } from '../../api/societyApi';
import socialStyles from './Social.module.css';
import searchStyles from './UserSearch.module.css';
const styles = { ...socialStyles, ...searchStyles };

async function fetchUserResults(query, moduleFilter, societyFilter, setResults, setLoading) {
    if (!query.trim() && !moduleFilter.trim() && !societyFilter.trim()) { setResults([]); return; }
    setLoading(true);
    try {
        const data = await searchUsers(query, moduleFilter, societyFilter);
        setResults(data.results || data);
    } catch (err) {
        console.error('Search failed', err);
    } finally {
        setLoading(false);
    }
}

function useClickOutside(ref, onOutside) {
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onOutside();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);
}

const useSearchInit = () => {
    const [allModules, setAllModules] = useState([]);
    const [allSocieties, setAllSocieties] = useState([]);
    useEffect(() => {
        getModules().then(setAllModules).catch(e => console.error("Err modules", e));
        fetchSocieties().then(res => setAllSocieties(res.results || res)).catch(e => console.error("Err societies", e));
    }, []);
    return { allModules, allSocieties };
};

function useSearchState() {
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(null);
    const containerRef = useRef(null);
    const { allModules, allSocieties } = useSearchInit();

    return {
        query, setQuery, userResults, setUserResults, allModules, allSocieties, loading, setLoading, dropdownPos, setDropdownPos, containerRef
    };
}

function useDropdownPosition(containerRef, query, moduleFilter, userResults, setDropdownPos, showDropdown) {
    useEffect(() => {
        if (!showDropdown || !containerRef.current) {
            setDropdownPos(null);
            return;
        }
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 350) });
    }, [showDropdown, userResults]);
}

function UserResultItem({ user, onSelect }) {
    return (
        <div className={`${styles.userItem} ${styles.userResultItem}`} onClick={onSelect}>
            <div className={styles.avatar}>{user.first_name?.[0] || user.username[0]}</div>
            <div className={styles.userNameDetails}>
                <span className={styles.userFullName}>{user.first_name} {user.last_name}</span>
                <span className={styles.userHandle}>@{user.username}</span>
            </div>
        </div>
    );
}

const FilterCheckbox = ({ isChecked, onToggle, id }) => (
    <input type="checkbox" checked={isChecked} onChange={() => onToggle(id)}
        className={styles.filterItemCheckbox} onClick={(e) => e.stopPropagation()} />
);

const MText = ({ m }) => (
    <div className={styles.filterItemText}>
        <span className={styles.filterItemTitle}>{m.module_code}</span>
        <span className={styles.filterItemSubtitle}>{m.module_name}</span>
    </div>
);

function ModuleResultItem({ module, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(module.module_code)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={module.module_code} />
            <MText m={module} />
        </div>
    );
}

const SText = ({ s }) => (
    <div className={styles.filterItemText}>
        <span className={styles.filterItemTitle}>{s.name}</span>
        {s.categories?.length > 0 && <span className={styles.filterItemCategory}>{s.categories[0]} society</span>}
    </div>
);

function SocietyResultItem({ society, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(society.id)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={society.id} />
            <SText s={society} />
        </div>
    );
}

const getModCode = m => m.module_code?.match(/^[A-Za-z]+/)?.[0].toUpperCase();
const safeModCode = m => getModCode(m) || '';
const getDepartmentsForModules = (modules) => {
    const deps = modules.map(safeModCode).filter(Boolean);
    return Array.from(new Set(deps)).sort();
};

const getCatName = s => s.categories?.[0]?.toLowerCase() || 'other';
const getSocietyCategories = (societies) => {
    const cats = societies.map(getCatName);
    return Array.from(new Set(cats)).sort();
};

const EmptySearchText = ({ text }) => <p className={styles.emptyText}>{text}</p>;

const SearchResultsList = ({ results, onSelect }) => (
    <div className={styles.userList}>
        {results.map((u, i) => <UserResultItem key={u.id || i} user={u} onSelect={() => onSelect(u)} />)}
    </div>
);

function SearchDropdown({ pos, loading, query, userResults, onUserSelect }) {
    const showEmpty = !loading && userResults.length === 0;
    return (
        <div className={styles.searchDropdownContainer} style={{ width: pos.width }}>
            {loading && <EmptySearchText text="Searching..." />}
            {showEmpty && query && <EmptySearchText text="No users found." />}
            {showEmpty && !query && <EmptySearchText text="Start typing..." />}
            {!loading && userResults.length > 0 && <SearchResultsList results={userResults} onSelect={onUserSelect} />}
        </div>
    );
}

const FilterTabs = ({ activeTab, setTab }) => (
    <div className={styles.filterTabs}>
        {['modules', 'societies'].map(tab => (
            <button key={tab} onClick={(e) => { e.preventDefault(); setTab(tab); }}
                className={`${styles.filterTab} ${activeTab === tab ? styles.filterTabActive : ''}`}>
                {tab}
            </button>
        ))}
    </div>
);

const SearchInput = ({ query, setQuery, tab }) => (
    <input type="text" placeholder={`Search ${tab}...`} value={query}
        onChange={(e) => setQuery(e.target.value)} className={styles.filterSearchInput} />
);

const ExpandBtn = ({ count, isExpanded, sectionKey, toggle }) => (
    count > 5 && (
        <button onClick={() => toggle(sectionKey)}
            className={`${styles.expandButton} ${isExpanded ? styles.collapseButton : ''}`}>
            {isExpanded ? 'Show less' : `+ ${count - 5} more`}
        </button>
    )
);

const GroupList = ({ items, isExpanded, renderItem, toggle, sectionKey }) => {
    const list = isExpanded ? items : items.slice(0, 5);
    return (
        <div className={styles.userList} style={{ gap: 0 }}>
            {list.map(renderItem)}
            <ExpandBtn count={items.length} isExpanded={isExpanded} sectionKey={sectionKey} toggle={toggle} />
        </div>
    );
};

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

const matchMod = (m, dept) => m.module_code?.toUpperCase().startsWith(dept);
const ModuleList = ({ modules, filterQuery, querySelected, onToggle, deps, expanded, toggleSection }) => {
    if (modules.length === 0) return <EmptySearchText text="No modules found." />;
    const rItem = (m, i) => <ModuleResultItem key={m.id || i} module={m} isChecked={querySelected(m.module_code)} onToggle={onToggle} />;
    if (filterQuery) return <div className={`${styles.userList} ${styles.userListNoGap}`}>{modules.slice(0, 15).map(rItem)}</div>;
    return (
        <div className={styles.groupContainer}>
            {deps.map(d => <GroupedSection key={d} title={d} items={modules.filter(m => matchMod(m, d))} expanded={expanded} renderItem={rItem} toggle={toggleSection} sectionKey={`mod_${d}`} />)}
        </div>
    );
};

const matchCat = (s, cat) => cat === 'other' ? (!s.categories || !s.categories.length) : (s.categories?.[0]?.toLowerCase() === cat);
const SocietyList = ({ societies, filterQuery, querySelected, onToggle, cats, expanded, toggleSection }) => {
    if (societies.length === 0) return <EmptySearchText text="No societies found." />;
    const rItem = s => <SocietyResultItem key={s.id} society={s} isChecked={querySelected(s.id)} onToggle={onToggle} />;
    if (filterQuery) return <div className={`${styles.userList} ${styles.userListNoGap}`}>{societies.map(rItem)}</div>;
    return (
        <div className={styles.groupContainer}>
            {cats.map(c => <GroupedSection key={c} title={c} items={societies.filter(s => matchCat(s, c))} expanded={expanded} renderItem={rItem} toggle={toggleSection} sectionKey={`soc_${c}`} capitalize />)}
        </div>
    );
};

function FilterDropdown({ activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery, moduleResults, selectedModules, toggleModule, societyResults, selectedSocieties, toggleSociety }) {
    const [expandedSections, setExpandedSections] = useState({});
    const deps = getDepartmentsForModules(moduleResults), cats = getSocietyCategories(societyResults);
    const toggleSection = (key) => setExpandedSections(p => ({ ...p, [key]: !p[key] }));
    return (
        <div className={styles.filterDropdown} onClick={(e) => e.stopPropagation()}>
            <FilterTabs activeTab={activeFilterTab} setTab={setActiveFilterTab} />
            <SearchInput query={filterQuery} setQuery={setFilterQuery} tab={activeFilterTab} />
            <div className={styles.filterListContainer}>
                {activeFilterTab === 'modules' && <ModuleList modules={moduleResults} filterQuery={filterQuery} querySelected={c => selectedModules.includes(c)} onToggle={toggleModule} deps={deps} expanded={expandedSections} toggleSection={toggleSection} />}
                {activeFilterTab === 'societies' && <SocietyList societies={societyResults} filterQuery={filterQuery} querySelected={id => selectedSocieties.includes(id)} onToggle={toggleSociety} cats={cats} expanded={expandedSections} toggleSection={toggleSection} />}
            </div>
        </div>
    );
}

const filterObj = (objs, q, keys) => objs.filter(o =>
    !q ? true : keys.some(k => (o[k] || '').toLowerCase().includes(q.toLowerCase()))
);
const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

const FilterBtn = ({ isOpen, setOpen }) => (
    <button onClick={setOpen} className={styles.filterBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </svg>
        Filter
    </button>
);

const SearchBar = ({ query, setQuery, setFocus, containerRef, showDpdwn, dpdwnPos, loading, userResults, handleSel }) => (
    <div className={`${styles.searchContainer} ${styles.relativeContainer}`} ref={containerRef}>
        <span className={styles.searchIcon}>🔍</span>
        <input type="text" className={styles.searchInput} placeholder="Search users..."
            value={query} onChange={(e) => setQuery(e.target.value)} onFocus={setFocus} />
        {showDpdwn && dpdwnPos && <SearchDropdown pos={dpdwnPos} loading={loading} query={query} userResults={userResults} onUserSelect={handleSel} />}
    </div>
);

const useUserSearchEffects = (query, selectedModules, selectedSocieties, setUserResults, setLoading) => {
    useEffect(() => {
        const timer = setTimeout(() => fetchUserResults(query, selectedModules.join(','), selectedSocieties.join(','), setUserResults, setLoading), 300);
        return () => clearTimeout(timer);
    }, [query, selectedModules, selectedSocieties]);
};

const FilterSection = ({ fRef, isOpen, setOpen, props }) => (
    <div ref={fRef} className={styles.relativeContainer}>
        <FilterBtn isOpen={isOpen} setOpen={setOpen} />
        {isOpen && <FilterDropdown {...props} />}
    </div>
);

const useFilterState = (allModules, allSocieties, query) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('modules');
    const [selectedModules, setSelectedModules] = useState([]);
    const [selectedSocieties, setSelectedSocieties] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');

    const fMods = filterObj(allModules, filterQuery, ['module_code', 'module_name']);
    const fSocs = filterObj(allSocieties, filterQuery, ['name']);
    const togMod = (c) => setSelectedModules(p => toggleArr(p, c));
    const togSoc = (id) => setSelectedSocieties(p => toggleArr(p, id));

    return {
        isFilterOpen, setIsFilterOpen, selectedModules, selectedSocieties,
        props: {
            activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery,
            moduleResults: fMods, selectedModules, toggleModule: togMod,
            societyResults: fSocs, selectedSocieties, toggleSociety: togSoc
        }
    };
};

export default function UserSearch({ onUserSelect }) {
    const { query, setQuery, userResults, setUserResults, allModules, allSocieties, loading, setLoading, dropdownPos, setDropdownPos, containerRef } = useSearchState();
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const filterRef = useRef(null);
    const { isFilterOpen, setIsFilterOpen, selectedModules, selectedSocieties, props } = useFilterState(allModules, allSocieties, query);

    useUserSearchEffects(query, selectedModules, selectedSocieties, setUserResults, setLoading);
    useDropdownPosition(containerRef, query, '', userResults, setDropdownPos, isSearchFocused && query.trim());
    useClickOutside(containerRef, () => setIsSearchFocused(false));
    useClickOutside(filterRef, () => setIsFilterOpen(false));

    const handleSelect = (user) => { if (onUserSelect) onUserSelect(user); setIsSearchFocused(false); setQuery(''); };
    const focusSearch = () => { setIsSearchFocused(true); setIsFilterOpen(false); };
    const togFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSearchFocused(false); };

    return (
        <div className={styles.userSearchWrapper}>
            <SearchBar query={query} setQuery={setQuery} setFocus={focusSearch} containerRef={containerRef}
                showDpdwn={isSearchFocused && query.trim()} dpdwnPos={dropdownPos} loading={loading}
                userResults={userResults} handleSel={handleSelect} />
            <FilterSection fRef={filterRef} isOpen={isFilterOpen} setOpen={togFilter} props={props} />
        </div>
    );
}
