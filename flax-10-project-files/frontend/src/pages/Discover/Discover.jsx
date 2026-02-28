import { useState, useEffect } from "react";
import styles from "./Discover.module.css";
import { searchUsers } from "../../api/userService";
import ShareButton from "../../components/Social/ShareButton";

function UserCard({ user, onNavChange }) {
    return (
        <div className={styles.userCard}>
            <div className={styles.userInfo} onClick={() => onNavChange?.("user_" + user.id)}>
                <div className={styles.avatar}>{user.first_name?.[0] || user.username[0]}</div>
                <div className={styles.userNameDetails}>
                    <span className={styles.userFullName}>{user.first_name} {user.last_name}</span>
                    <span className={styles.userHandle}>@{user.username}</span>
                </div>
            </div>
            <ShareButton userId={user.id} initialIsSharing={user.is_sharing ?? false} />
        </div>
    );
}

export default function Discover({ onNavChange }) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [moduleFilter, setModuleFilter] = useState("");

    // Fetch users whenever search query changes
    useEffect(() => {
        const fetchDiscoverUsers = async () => {
            setLoading(true);
            try {
                const data = await searchUsers(searchQuery);
                setUsers(data.results || data);
            } catch (err) {
                console.error("Failed to fetch users", err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchDiscoverUsers();
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Derived state for client-side module filtering
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    const filteredUsers = users.filter(u => {
        if (u.id === currentUser.id || u.username === currentUser.username) return false;
        if (!moduleFilter) return true;

        // Ensure graceful fallback if modules isn't returned
        const userModules = u.modules || [];
        return userModules.some(m => m.toLowerCase().includes(moduleFilter.toLowerCase()));
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Discover</h1>
                <p>Find course mates and study partners</p>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search by name or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className={styles.moduleWrap}>
                    <input
                        type="text"
                        className={styles.moduleInput}
                        placeholder="Filter by module (e.g. 5CUS2SEG)"
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                    />
                </div>
            </div>

            {loading && users.length === 0 ? (
                <div className={styles.loadingState}>Loading discover...</div>
            ) : (
                <div className={styles.grid}>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <UserCard key={u.id} user={u} onNavChange={onNavChange} />
                        ))
                    ) : (
                        <div className={styles.emptyState}>No users found. Try adjusting your filters.</div>
                    )}
                </div>
            )}
        </div>
    );
}
