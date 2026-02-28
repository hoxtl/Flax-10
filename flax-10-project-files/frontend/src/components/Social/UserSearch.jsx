import { useState, useEffect, useRef } from 'react';
import { searchUsers } from '../../api/userService';
import FollowButton from './FollowButton';
import styles from './Social.module.css';

export default function UserSearch({ onUserSelect }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!query.trim()) { setResults([]); return; }
            setLoading(true);
            try {
                const data = await searchUsers(query);
                setResults(data.results || data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Recompute dropdown position whenever query changes so it stays anchored
    useEffect(() => {
        if (query.trim() && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 300) });
        }
    }, [query, results]);

    return (
        <div className={styles.searchContainer} ref={containerRef}>
            <span className={styles.searchIcon}>🔍</span>
            <input
                type="text"
                className={styles.searchInput}
                placeholder="Search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && dropdownPos && (
                <div className={styles.searchResults} style={{
                    position: 'fixed',
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                    zIndex: 9999,
                }}>
                    {loading ? (
                        <p className={styles.emptyText}>Searching...</p>
                    ) : results.length > 0 ? (
                        <div className={styles.userList}>
                            {results.map((u, index) => (
                                <div key={u.id || u.username || index} className={styles.userItem}>
                                    <div
                                        className={styles.userInfo}
                                        onClick={() => { onUserSelect?.(u); setQuery(''); }}
                                        style={{ cursor: 'pointer', flex: 1 }}
                                    >
                                        <div className={styles.avatar}>{u.first_name?.[0] || u.username[0]}</div>
                                        <div className={styles.userNameDetails}>
                                            <span className={styles.userFullName}>{u.first_name} {u.last_name}</span>
                                            <span className={styles.userHandle}>@{u.username}</span>
                                        </div>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <FollowButton userId={u.id} initialIsFollowing={u.is_following ?? false} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.emptyText}>No users found.</p>
                    )}
                </div>
            )}
        </div>
    );
}
