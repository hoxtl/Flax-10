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
    const [moduleFilter, setModuleFilter] = useState('');
    const [activeTab, setActiveTab] = useState('users');
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
        query, setQuery, moduleFilter, setModuleFilter, activeTab, setActiveTab,
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

function SearchDropdown({ pos, loading, activeTab, setActiveTab, query, moduleFilter, setModuleFilter, userResults, moduleResults, onUserSelect }) {
    const dropdownStyle = {
        position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px'
    };

    return (
        <div className={styles.searchResults} style={dropdownStyle}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                {['users', 'modules', 'societies'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: activeTab === tab ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab ? 'white' : 'var(--text)',
                            border: 'none', padding: '6px 12px', borderRadius: '16px',
                            cursor: 'pointer', fontSize: '0.85rem', textTransform: 'capitalize'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content area */}
            <div style={{ minHeight: '150px' }}>
                {activeTab === 'users' && (
                    <>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Filter by course code (e.g. 5CUS)"
                            value={moduleFilter}
                            onChange={(e) => setModuleFilter(e.target.value)}
                            style={{ width: '100%', paddingLeft: '12px', marginBottom: '12px', padding: '8px 12px' }}
                        />
                        {loading && <p className={styles.emptyText}>Searching...</p>}
                        {!loading && userResults.length === 0 && (query || moduleFilter) && <p className={styles.emptyText}>No users found.</p>}
                        {!loading && userResults.length === 0 && !query && !moduleFilter && <p className={styles.emptyText}>Start typing to search.</p>}
                        {!loading && userResults.length > 0 && (
                            <div className={styles.userList}>
                                {userResults.map((u, i) => <UserResultItem key={u.id || i} user={u} onSelect={() => onUserSelect(u)} />)}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'modules' && (
                    <>
                        {moduleResults.length === 0 ? (
                            <p className={styles.emptyText}>{query ? "No modules found." : "Start typing to search modules."}</p>
                        ) : (
                            <div className={styles.userList}>
                                {moduleResults.slice(0, 10).map((m, i) => (
                                    <ModuleResultItem key={m.id || i} module={m} onSelect={() => {/* Could navigate to module page */ }} />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'societies' && (
                    <p className={styles.emptyText}>Societies search coming soon!</p>
                )}
            </div>
        </div>
    );
}

export default function UserSearch({ onUserSelect }) {
    const {
        query, setQuery, moduleFilter, setModuleFilter, activeTab, setActiveTab,
        userResults, setUserResults, allModules, loading, setLoading,
        dropdownPos, setDropdownPos, containerRef
    } = useSearchState();

    const [isFocused, setIsFocused] = useState(false);

    // User search effect
    useEffect(() => {
        if (activeTab === 'users') {
            const timer = setTimeout(() => fetchUserResults(query, moduleFilter, setUserResults, setLoading), 300);
            return () => clearTimeout(timer);
        }
    }, [query, moduleFilter, activeTab]);

    const showDropdown = isFocused && (query.trim() || moduleFilter.trim() || activeTab !== 'users');

    useDropdownPosition(containerRef, query, moduleFilter, userResults, setDropdownPos, showDropdown);
    useClickOutside(containerRef, () => setIsFocused(false));

    const handleSelect = (user) => {
        if (onUserSelect) onUserSelect(user);
        setIsFocused(false);
        setQuery('');
        setModuleFilter('');
    };

    // Filter modules client-side
    const filteredModules = allModules.filter(m => {
        if (!query) return true;
        const q = query.toLowerCase();
        return (m.module_code || '').toLowerCase().includes(q) || (m.module_name || '').toLowerCase().includes(q);
    });

    return (
        <div className={styles.searchContainer} ref={containerRef}>
            <span className={styles.searchIcon}>🔍</span>
            <input
                type="text"
                className={styles.searchInput}
                placeholder={`Search ${activeTab}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
            />
            {showDropdown && dropdownPos && (
                <SearchDropdown
                    pos={dropdownPos}
                    loading={loading}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    query={query}
                    moduleFilter={moduleFilter}
                    setModuleFilter={setModuleFilter}
                    userResults={userResults}
                    moduleResults={filteredModules}
                    onUserSelect={handleSelect}
                />
            )}
        </div>
    );
}
