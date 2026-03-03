import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '../../api/userService';
import { getModules } from '../../api/moduleApi';
import { fetchSocieties } from '../../api/societyApi';
import socialStyles from './Social.module.css';
import searchStyles from './UserSearch.module.css';
const styles = { ...socialStyles, ...searchStyles };

async function fetchUserResults(query, mods, socs, setRes, setL) {
    if (!query.trim() && !mods.trim() && !socs.trim()) return setRes([]);
    setL(true);
    const data = await searchUsers(query, mods, socs).catch(() => []);
    setRes(data.results || data);
    setL(false);
}

export function useClickOutside(ref, onOutside) {
    useEffect(() => {
        const handler = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ref, onOutside]);
}

export const useSearchInit = () => {
    const [allModules, setAllModules] = useState([]);
    const [allSocieties, setAllSocieties] = useState([]);
    useEffect(() => {
        getModules().then(setAllModules).catch(e => handleErr("Modules error", e, setAllModules));
        fetchSocieties().then(res => setAllSocieties(res.results || res)).catch(e => handleErr("Societies error", e, setAllSocieties));
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
    return { query, setQuery, userResults, setUserResults, allModules, allSocieties, loading, setLoading, dropdownPos, setDropdownPos, containerRef };
}

function useDropdownPosition(containerRef, userResults, setDropdownPos, showDropdown) {
    useEffect(() => {
        if (!showDropdown || !containerRef.current) return setDropdownPos(null);
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 350) });
    }, [showDropdown, userResults]);
}

export function UserResultItem({ user, onSelect }) {
    const initials = user.first_name?.[0] || user.username[0];
    return (
        <div className={`${styles.userItem} ${styles.userResultItem}`} onClick={onSelect}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.userNameDetails}>
                <span className={styles.userFullName}>{user.first_name} {user.last_name}</span>
                <span className={styles.userHandle}>@{user.username}</span>
            </div>
        </div>
    );
}

const FilterCheckbox = ({ isChecked, onToggle, id }) => (
    <input type="checkbox" checked={isChecked} onChange={() => onToggle(id)} className={styles.filterItemCheckbox} onClick={(e) => e.stopPropagation()} />
);

const MText = ({ m }) => (
    <div className={styles.filterItemText}>
        <span className={styles.filterItemTitle}>{m.module_code}</span>
        <span className={styles.filterItemSubtitle}>{m.module_name}</span>
    </div>
);

export function ModuleResultItem({ module, isChecked, onToggle }) {
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

export function SocietyResultItem({ society, isChecked, onToggle }) {
    return (
        <div className={`${styles.userItem} ${styles.filterItem}`} onClick={() => onToggle(society.id)}>
            <FilterCheckbox isChecked={isChecked} onToggle={onToggle} id={society.id} />
            <SText s={society} />
        </div>
    );
}

const getModCode = m => m.module_code?.match(/^[A-Za-z]+/)?.[0].toUpperCase();
const getDepartmentsForModules = (modules) => Array.from(new Set(modules.map(m => getModCode(m) || '').filter(Boolean))).sort();
const getSocietyCategories = (societies) => Array.from(new Set(societies.map(s => s.categories?.[0]?.toLowerCase() || 'other'))).sort();

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
            <button key={tab} onClick={(e) => { e.preventDefault(); setTab(tab); }} className={`${styles.filterTab} ${activeTab === tab ? styles.filterTabActive : ''}`}>{tab}</button>
        ))}
    </div>
);

const FilterSearchInput = ({ query, setQuery, tab }) => (
    <input type="text" placeholder={`Search ${tab}...`} value={query} onChange={(e) => setQuery(e.target.value)} className={styles.filterSearchInput} />
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

function FilterDropdown({ activeFilterTab: tab, setActiveFilterTab: setT, filterQuery: q, setFilterQuery: setQ, moduleResults: mR, selectedModules: sM, toggleModule: tM, societyResults: sR, selectedSocieties: sS, toggleSociety: tS }) {
    const [expanded, setExpanded] = useState({});
    const deps = getDepartmentsForModules(mR), cats = getSocietyCategories(sR);
    const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));
    return (
        <div className={styles.filterDropdown} onClick={(e) => e.stopPropagation()}>
            <FilterTabs activeTab={tab} setTab={setT} />
            <FilterSearchInput query={q} setQuery={setQ} tab={tab} />
            <div className={styles.filterListContainer}>
                {tab === 'modules' && <ModuleList modules={mR} filterQuery={q} querySelected={c => sM.includes(c)} onToggle={tM} deps={deps} expanded={expanded} toggleSection={toggle} />}
                {tab === 'societies' && <SocietyList societies={sR} filterQuery={q} querySelected={id => sS.includes(id)} onToggle={tS} cats={cats} expanded={expanded} toggleSection={toggle} />}
            </div>
        </div>
    );
}

const filterObj = (objs, q, keys) => objs.filter(o => !q ? true : keys.some(k => (o[k] || '').toLowerCase().includes(q.toLowerCase())));
const toggleArr = (arr, val) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

function GlobalSearchBar({ query, setQuery, setFocus, containerRef, showDpdwn, dpdwnPos, loading, userResults, handleSel }) {
    const onFocus = () => setFocus();
    return (
        <div className={`${styles.searchContainer} ${styles.relativeContainer}`} ref={containerRef}>
            <span className={styles.searchIcon}>🔍</span>
            <input type="text" className={styles.searchInput} placeholder="Search users..." value={query} onChange={(e) => setQuery(e.target.value)} onFocus={onFocus} />
            {showDpdwn && dpdwnPos && <SearchDropdown pos={dpdwnPos} loading={loading} query={query} userResults={userResults} onUserSelect={handleSel} />}
        </div>
    );
}

const useUserSearchEffects = (query, selectedModules, selectedSocieties, setUserResults, setLoading) => {
    useEffect(() => {
        const timer = setTimeout(() => fetchUserResults(query, selectedModules.join(','), selectedSocieties.join(','), setUserResults, setLoading), 300);
        return () => clearTimeout(timer);
    }, [query, selectedModules, selectedSocieties]);
};

export const FilterSection = ({ fRef, isOpen, setOpen, props }) => (
    <div ref={fRef} className={styles.relativeContainer}>
        <button onClick={setOpen} className={styles.filterBtn}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg> Filter</button>
        {isOpen && <FilterDropdown {...props} />}
    </div>
);

export const useFilterState = (allModules, allSocieties, query, isSearchFocused, containerRef, userResults, setDropdownPos, setUserResults, setLoading) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('modules');
    const [selectedModules, setSelectedModules] = useState([]);
    const [selectedSocieties, setSelectedSocieties] = useState([]);
    const [filterQuery, setFilterQuery] = useState('');
    const togMod = (c) => setSelectedModules(p => toggleArr(p, c)), togSoc = (id) => setSelectedSocieties(p => toggleArr(p, id));
    useUserSearchEffects(query, selectedModules, selectedSocieties, setUserResults, setLoading);
    const active = isSearchFocused && (query.trim() || selectedModules.length > 0 || selectedSocieties.length > 0);
    useDropdownPosition(containerRef, userResults, setDropdownPos, active);
    const props = { activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery, moduleResults: filterObj(allModules, filterQuery, ['module_code', 'module_name']), selectedModules, toggleModule: togMod, societyResults: filterObj(allSocieties, filterQuery, ['name']), selectedSocieties, toggleSociety: togSoc };
    return { isFilterOpen, setIsFilterOpen, active, props };
};

export default function UserSearch({ onUserSelect }) {
    const { query, setQuery, userResults, setUserResults, allModules: aM, allSocieties: aS, loading, setLoading, dropdownPos, setDropdownPos, containerRef } = useSearchState();
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const filterRef = useRef(null);
    const { isFilterOpen, setIsFilterOpen, active, props } = useFilterState(aM, aS, query, isSearchFocused, containerRef, userResults, setDropdownPos, setUserResults, setLoading);
    useClickOutside(containerRef, () => setIsSearchFocused(false));
    useClickOutside(filterRef, () => setIsFilterOpen(false));
    const handleS = (u) => { onUserSelect?.(u); setIsSearchFocused(false); setQuery(''); };
    const onSetFocus = () => { setIsSearchFocused(true); setIsFilterOpen(false); };
    const onToggleFilter = () => { setIsFilterOpen(!isFilterOpen); setIsSearchFocused(false); };
    return (
        <div className={styles.userSearchWrapper}>
            <GlobalSearchBar query={query} setQuery={setQuery} setFocus={onSetFocus} containerRef={containerRef} showDpdwn={active} dpdwnPos={dropdownPos} loading={loading} userResults={userResults} handleSel={handleS} />
            <FilterSection fRef={filterRef} isOpen={isFilterOpen} setOpen={onToggleFilter} props={props} />
        </div>
    );
}
