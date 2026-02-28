import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '../../api/userService';
import FollowButton from './FollowButton';
import styles from './Social.module.css';

async function fetchSearchResults(query, setResults, setLoading) {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
        const data = await searchUsers(query);
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
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(null);
    const containerRef = useRef(null);
    return { query, setQuery, results, setResults, loading, setLoading, dropdownPos, setDropdownPos, containerRef };
}

function useDropdownPosition(containerRef, query, results, setDropdownPos) {
    useEffect(() => {
        if (!query.trim() || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 300) });
    }, [query, results]);
}

function useSearchEffect(query, setResults, setLoading) {
    useEffect(() => {
        const timer = setTimeout(() => fetchSearchResults(query, setResults, setLoading), 300);
        return () => clearTimeout(timer);
    }, [query]);
}

function UserResultItem({ user, onSelect }) {
    return (
        <div className={styles.userItem}>
            <div className={styles.userInfo} onClick={onSelect} style={{ cursor: 'pointer', flex: 1 }}>
                <div className={styles.avatar}>{user.first_name?.[0] || user.username[0]}</div>
                <div className={styles.userNameDetails}>
                    <span className={styles.userFullName}>{user.first_name} {user.last_name}</span>
                    <span className={styles.userHandle}>@{user.username}</span>
                </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
                <FollowButton userId={user.id} initialIsFollowing={user.is_following ?? false} />
            </div>
        </div>
    );
}

function SearchDropdown({ pos, loading, results, onSelect }) {
    const dropdownStyle = { position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 };
    return (
        <div className={styles.searchResults} style={dropdownStyle}>
            {loading && <p className={styles.emptyText}>Searching...</p>}
            {!loading && results.length === 0 && <p className={styles.emptyText}>No users found.</p>}
            {!loading && results.length > 0 && (
                <div className={styles.userList}>
                    {results.map((u, i) => <UserResultItem key={u.id || i} user={u} onSelect={() => onSelect(u)} />)}
                </div>
            )}
        </div>
    );
}

export default function UserSearch({ onUserSelect }) {
    const { query, setQuery, results, setResults, loading, setLoading, dropdownPos, setDropdownPos, containerRef } = useSearchState();

    useSearchEffect(query, setResults, setLoading);
    useDropdownPosition(containerRef, query, results, setDropdownPos);
    useClickOutside(containerRef, () => setQuery(''));

    const handleSelect = (user) => { onUserSelect?.(user); setQuery(''); };

    return (
        <div className={styles.searchContainer} ref={containerRef}>
            <span className={styles.searchIcon}>🔍</span>
            <input type="text" className={styles.searchInput} placeholder="Search users..."
                value={query} onChange={(e) => setQuery(e.target.value)} />
            {query.trim() && dropdownPos && (
                <SearchDropdown pos={dropdownPos} loading={loading} results={results} onSelect={handleSelect} />
            )}
        </div>
    );
}
