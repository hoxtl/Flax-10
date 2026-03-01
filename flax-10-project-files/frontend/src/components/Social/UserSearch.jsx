import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '../../api/userService';
import { getModules } from '../../api/moduleApi';
import styles from './Social.module.css';

async function fetchUserResults(query, moduleFilter, setResults, setLoading) {
    if (!query.trim() && !moduleFilter.trim()) { setResults([]); return; }
    setLoading(true);
    try {
        const data = await searchUsers(query, moduleFilter);
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

function useSearchState() {
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [allModules, setAllModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(null);
    const containerRef = useRef(null);

    // Initial load for modules
    useEffect(() => {
        getModules().then(setAllModules).catch(e => console.error("Failed to load modules", e));
    }, []);

    return {
        query, setQuery,
        userResults, setUserResults, allModules, loading, setLoading,
        dropdownPos, setDropdownPos, containerRef
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
        <div className={styles.userItem} onClick={onSelect} style={{ cursor: 'pointer', justifyContent: 'flex-start', gap: '12px' }}>
            <div className={styles.avatar}>{user.first_name?.[0] || user.username[0]}</div>
            <div className={styles.userNameDetails}>
                <span className={styles.userFullName}>{user.first_name} {user.last_name}</span>
                <span className={styles.userHandle}>@{user.username}</span>
            </div>
        </div>
    );
}

function ModuleResultItem({ module, onSelect }) {
    return (
        <div className={styles.userItem} onClick={onSelect} style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{module.module_code}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{module.module_name}</span>
        </div>
    );
}

function getDepartmentsForModules(modules) {
    const deps = new Set();
    modules.forEach(m => {
        const match = m.module_code?.match(/^[A-Za-z]+/);
        if (match) deps.add(match[0].toUpperCase());
    });
    return Array.from(deps).sort();
}

function SearchDropdown({ pos, loading, activeTab, setActiveTab, query, userResults, moduleResults, onUserSelect }) {
    const dropdownStyle = {
        position: 'absolute', top: '100%', marginTop: '8px', left: 0, width: pos.width, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px',
        background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px',
        boxShadow: '0 4px 12px var(--shadow-color)', maxHeight: '400px', overflowY: 'auto'
    };

    return (
        <div style={dropdownStyle}>
            {loading && <p className={styles.emptyText}>Searching...</p>}
            {!loading && userResults.length === 0 && query && <p className={styles.emptyText}>No users found.</p>}
            {!loading && userResults.length === 0 && !query && <p className={styles.emptyText}>Start typing to search users.</p>}
            {!loading && userResults.length > 0 && (
                <div className={styles.userList}>
                    {userResults.map((u, i) => <UserResultItem key={u.id || i} user={u} onSelect={() => onUserSelect(u)} />)}
                </div>
            )}
        </div>
    );
}

function FilterDropdown({ pos, activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery, moduleResults }) {
    const dropdownStyle = {
        position: 'absolute', top: '100%', marginTop: '8px', right: 0, width: '350px', zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px',
        background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px',
        boxShadow: '0 4px 12px var(--shadow-color)', maxHeight: '400px', overflowY: 'auto'
    };

    const departments = getDepartmentsForModules(moduleResults);

    return (
        <div style={dropdownStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                {['modules', 'societies'].map(tab => (
                    <button
                        key={tab}
                        onClick={(e) => { e.preventDefault(); setActiveFilterTab(tab); }}
                        style={{
                            background: activeFilterTab === tab ? 'var(--primary)' : 'transparent',
                            color: activeFilterTab === tab ? 'white' : 'var(--text)',
                            border: 'none', padding: '6px 16px', borderRadius: '16px',
                            cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: 600
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <input
                type="text"
                placeholder={`Search ${activeFilterTab}...`}
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{
                    width: '100%', padding: '8px 12px', boxSizing: 'border-box',
                    border: '1px solid var(--border)', borderRadius: '8px',
                    background: 'var(--search-bg)', color: 'var(--text)'
                }}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {activeFilterTab === 'modules' && (
                    <>
                        {moduleResults.length === 0 ? (
                            <p className={styles.emptyText}>No modules found.</p>
                        ) : filterQuery ? (
                            <div className={styles.userList} style={{ gap: 0 }}>
                                {moduleResults.slice(0, 15).map((m, i) => (
                                    <ModuleResultItem key={m.id || i} module={m} onSelect={() => { window.location.href = `/modules?search=${m.module_code}`; }} />
                                ))}
                            </div>
                        ) : (
                            // List by department if no search query
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {departments.map(dept => {
                                    const deptModules = moduleResults.filter(m => m.module_code?.toUpperCase().startsWith(dept));
                                    if (deptModules.length === 0) return null;
                                    return (
                                        <div key={dept}>
                                            <h4 style={{ margin: '0 0 8px 8px', fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 600 }}>{dept}</h4>
                                            <div className={styles.userList} style={{ gap: 0 }}>
                                                {deptModules.slice(0, 5).map((m, i) => (
                                                    <ModuleResultItem key={m.id || i} module={m} onSelect={() => { window.location.href = `/modules?search=${m.module_code}`; }} />
                                                ))}
                                                {deptModules.length > 5 && (
                                                    <div style={{ padding: '8px', fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center' }}>
                                                        + {deptModules.length - 5} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {activeFilterTab === 'societies' && (
                    <p className={styles.emptyText}>Societies data not yet linked.</p>
                )}
            </div>
        </div>
    );
}

export default function UserSearch({ onUserSelect }) {
    const {
        query, setQuery, activeTab,
        userResults, setUserResults, allModules, loading, setLoading,
        dropdownPos, setDropdownPos, containerRef
    } = useSearchState();

    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('modules');
    const [filterQuery, setFilterQuery] = useState('');
    const filterRef = useRef(null);

    // User search effect
    useEffect(() => {
        const timer = setTimeout(() => fetchUserResults(query, '', setUserResults, setLoading), 300);
        return () => clearTimeout(timer);
    }, [query]);

    const showSearchDropdown = isSearchFocused && query.trim();

    useDropdownPosition(containerRef, query, '', userResults, setDropdownPos, showSearchDropdown);
    useClickOutside(containerRef, () => {
        setIsSearchFocused(false);
    });
    useClickOutside(filterRef, () => {
        setIsFilterOpen(false);
    });

    const handleSelect = (user) => {
        if (onUserSelect) onUserSelect(user);
        setIsSearchFocused(false);
        setQuery('');
    };

    // Filter modules client-side for the filter dropdown
    const filteredModules = allModules.filter(m => {
        if (!filterQuery) return true;
        const q = filterQuery.toLowerCase();
        return (m.module_code || '').toLowerCase().includes(q) || (m.module_name || '').toLowerCase().includes(q);
    });

    return (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', position: 'relative' }}>
            <div className={styles.searchContainer} ref={containerRef} style={{ position: 'relative' }}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search users..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { setIsSearchFocused(true); setIsFilterOpen(false); }}
                />
                {showSearchDropdown && dropdownPos && (
                    <SearchDropdown
                        pos={dropdownPos}
                        loading={loading}
                        query={query}
                        userResults={userResults}
                        onUserSelect={handleSelect}
                    />
                )}
            </div>

            <div ref={filterRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSearchFocused(false); }}
                    style={{
                        padding: '8px 16px', background: isFilterOpen ? 'var(--hover)' : 'transparent',
                        border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)',
                        cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    Filter
                </button>
                {isFilterOpen && (
                    <FilterDropdown
                        activeFilterTab={activeFilterTab}
                        setActiveFilterTab={setActiveFilterTab}
                        filterQuery={filterQuery}
                        setFilterQuery={setFilterQuery}
                        moduleResults={filteredModules}
                    />
                )}
            </div>
        </div>
    );
}
