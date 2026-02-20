import { useState, useEffect } from 'react';
import { searchUsers } from '../../api/userService';
import FollowButton from './FollowButton';
import styles from './Social.module.css';

export default function UserSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
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

        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className={styles.searchContainer}>
            <input
                type="text"
                className={styles.searchInput}
                placeholder="Search users..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() && (
                <div className={styles.searchResults}>
                    {loading ? (
                        <p className={styles.emptyText}>Searching...</p>
                    ) : results.length > 0 ? (
                        <div className={styles.userList}>
                            {results.map(u => (
                                <div key={u.id} className={styles.userItem}>
                                    <div className={styles.userInfo}>
                                        <div className={styles.avatar}>{u.first_name?.[0] || u.username[0]}</div>
                                        <div className={styles.userNameDetails}>
                                            <span className={styles.userFullName}>{u.first_name} {u.last_name}</span>
                                            <span className={styles.userHandle}>@{u.username}</span>
                                        </div>
                                    </div>
                                    {/* We will need to pass initialIsFollowing down from API later if search returns it 
                                        Assuming the backend doesn't return it yet, we default to false or handle it */}
                                    <FollowButton userId={u.id} initialIsFollowing={false} />
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
