import { useState, useEffect, useRef } from "react";
import styles from "./Discover.module.css";
import { searchUsers } from "../../api/userService";
import { FilterSection, useSearchInit, useFilterState, useClickOutside } from "../../components/Social/UserSearch";

function UserCard({ user, onNavChange }) {
    const initials = user.first_name?.[0] || user.username[0];
    return (
        <div className={styles.userCard} onClick={() => onNavChange?.("profile_" + user.id)}>
            <div className={styles.avatar}>{initials}</div>
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

function useDiscoverFetch(searchQuery, filterState) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    useEffect(() => {
        const run = async () => {
            setLoading(true);
            const { selectedModules, selectedSocieties } = filterState.props;
            const data = await searchUsers(searchQuery, selectedModules.join(','), selectedSocieties.join(',')).catch(() => []);
            setUsers(data.results || data);
            setLoading(false);
        };
        const timer = setTimeout(run, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterState.props.selectedModules, filterState.props.selectedSocieties]);
    return { loading, users };
}

function useDiscoverUIState(searchQuery) {
    const [userResults, setUserResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [dropdownPos, setDropdownPos] = useState(null);
    const containerRef = useRef(null);
    const filterRef = useRef(null);
    const { allModules, allSocieties } = useSearchInit();
    const filterState = useFilterState(allModules, allSocieties, searchQuery, true, containerRef, userResults, setDropdownPos, setUserResults, setSearchLoading);
    useClickOutside(filterRef, () => filterState.setIsFilterOpen(false));
    return { containerRef, filterRef, filterState };
}

function useDiscoverSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const ui = useDiscoverUIState(searchQuery);
    const { loading, users } = useDiscoverFetch(searchQuery, ui.filterState);
    return { loading, users, searchQuery, setSearchQuery, ...ui };
}

function DiscoverHeader() {
    return (
        <div className={styles.header}>
            <div>
                <h1 className={styles.pageTitle}>Users</h1>
                <p className={styles.subtitle}>Find course mates and study partners</p>
            </div>
        </div>
    );
}

function SearchBar({ searchQuery, setSearchQuery, containerRef, filterRef, filterState }) {
    return (
        <div className={styles.filterBar}>
            <div className={styles.searchWrap} ref={containerRef}>
                <span className={styles.searchIcon}>🔍</span>
                <input type="text" className={styles.searchInput} placeholder="Search by name or username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <FilterSection fRef={filterRef} isOpen={filterState.isFilterOpen} setOpen={() => filterState.setIsFilterOpen(!filterState.isFilterOpen)} props={filterState.props} />
        </div>
    );
}

function UsersGrid({ users, onNavChange }) {
    const currentUser = JSON.parse(localStorage.getItem("user")) || {};
    const filtered = users.filter(u => u.id !== currentUser.id && u.username !== currentUser.username);
    if (filtered.length === 0) return <div className={styles.emptyState}>No users found. Try adjusting your filters.</div>;
    return (
        <div className={styles.grid}>
            {filtered.map(u => <UserCard key={u.id} user={u} onNavChange={onNavChange} />)}
        </div>
    );
}

export default function Discover({ onNavChange }) {
    const { loading, users, searchQuery, setSearchQuery, containerRef, filterRef, filterState } = useDiscoverSearch();
    const showLoader = loading && users.length === 0;
    return (
        <div className={styles.container}>
            <DiscoverHeader />
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} containerRef={containerRef} filterRef={filterRef} filterState={filterState} />
            {showLoader ? <div className={styles.loadingState}>Loading users...</div> : <UsersGrid users={users} onNavChange={onNavChange} />}
        </div>
    );
}
