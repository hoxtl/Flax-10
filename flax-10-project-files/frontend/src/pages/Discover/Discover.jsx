import { useState, useEffect, useRef } from "react";
import styles from "./Discover.module.css";
import { searchUsers } from "../../api/userService";
import ShareButton from "../../components/Social/ShareButton";
import { FilterSection, useSearchInit, useFilterState, useClickOutside } from "../../components/Social/UserSearch";

function UserCard({ user, onNavChange }) {
    return (
        <div className={styles.userCard} onClick={() => onNavChange?.("profile_" + user.id)}>
            <div className={styles.avatar}>
                {user.first_name?.[0] || user.username[0]}
            </div>
            <div className={styles.userInfo}>
                <div className={styles.name}>{user.first_name} {user.last_name}</div>
                <div className={styles.username}>@{user.username}</div>
                <div className={styles.courseInfo}>
                    {user.year && <span>{user.year}</span>}
                    {user.major && <span> • {user.major}</span>}
                </div>
            </div>
        </div>
    );
}

export default function Discover({ onNavChange }) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Unified Filter State
    const { allModules, allSocieties } = useSearchInit();
    const [userResults, setUserResults] = useState([]); // for searchUsers internal
    const [searchLoading, setSearchLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(null);
    const containerRef = useRef(null);
    const filterRef = useRef(null);

    const { isFilterOpen, setIsFilterOpen, props } = useFilterState(
        allModules, allSocieties, searchQuery, true, containerRef,
        userResults, setDropdownPos, setUserResults, setSearchLoading
    );

    const { selectedModules, selectedSocieties } = props;

    // Handle clicks outside
    useClickOutside(filterRef, () => setIsFilterOpen(false));

    // Fetch users whenever search query changes
    useEffect(() => {
        const fetchDiscoverUsers = async () => {
            setLoading(true);
            try {
                const data = await searchUsers(
                    searchQuery,
                    selectedModules.join(','),
                    selectedSocieties.join(',')
                );
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
    }, [searchQuery, selectedModules, selectedSocieties]);

    // Derived state for client-side module filtering (no longer needed as we filter on backend)
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    const filteredUsers = users.filter(u => {
        if (u.id === currentUser.id || u.username === currentUser.username) return false;
        return true;
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Discover</h1>
                <p>Find course mates and study partners</p>
            </div>

            <div className={styles.filterBar}>
                <div className={styles.searchWrap} ref={containerRef}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search by name or username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <FilterSection
                    fRef={filterRef}
                    isOpen={isFilterOpen}
                    setOpen={() => setIsFilterOpen(!isFilterOpen)}
                    props={props}
                />
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
