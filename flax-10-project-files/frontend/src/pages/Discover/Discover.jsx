import { useState, useEffect, useRef, useCallback } from "react";
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

async function loadUsers(query, filters, offset, setU, setM, setL, appending) {
    if (!appending) setL(true);
    const d = await searchUsers(query, filters.mods.join(','), filters.socs.join(','), offset, 20).catch(() => ({ results: [] }));
    const res = d.results || [];
    if (appending) setU(p => [...p, ...res]);
    if (!appending) setU(res);
    setM(d.has_more || false);
    setL(false);
}

function useDiscoverFetch(query, filterState) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [hasMore, setHasMore] = useState(false);
    const filters = { mods: filterState.props.selectedModules, socs: filterState.props.selectedSocieties };
    useEffect(() => {
        const timer = setTimeout(() => loadUsers(query, filters, 0, setUsers, setHasMore, setLoading, false), 300);
        return () => clearTimeout(timer);
    }, [query, filters.mods, filters.socs]);
    const fetchMore = () => !loading && hasMore && loadUsers(query, filters, users.length, setUsers, setHasMore, setLoading, true);
    return { loading, users, hasMore, fetchMore };
}

function useDiscoverUIState(query) {
    const [res, setRes] = useState([]);
    const [sL, setSL] = useState(false);
    const [pos, setPos] = useState(null);
    const cRef = useRef(null);
    const fRef = useRef(null);
    const { allModules, allSocieties } = useSearchInit();
    const fS = useFilterState(allModules, allSocieties, query, true, cRef, res, setPos, setRes, setSL);
    useClickOutside(fRef, () => fS.setIsFilterOpen(false));
    return { containerRef: cRef, filterRef: fRef, filterState: fS };
}

function useDiscoverSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const ui = useDiscoverUIState(searchQuery);
    const fetch = useDiscoverFetch(searchQuery, ui.filterState);
    return { ...fetch, searchQuery, setSearchQuery, ...ui };
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
    const toggle = () => filterState.setIsFilterOpen(!filterState.isFilterOpen);
    return (
        <div className={styles.filterBar}>
            <div className={styles.searchWrap} ref={containerRef}>
                <span className={styles.searchIcon}>🔍</span>
                <input type="text" className={styles.searchInput} placeholder="Search by name or username..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <FilterSection fRef={filterRef} isOpen={filterState.isFilterOpen} setOpen={toggle} props={filterState.props} />
        </div>
    );
}

const onIntersect = (entries, hasMore, fetchMore) => entries[0].isIntersecting && hasMore && fetchMore();
function useScrollObserver(loading, hasMore, fetchMore) {
    const obs = useRef();
    return useCallback(node => {
        if (loading || !node) return;
        if (obs.current) obs.current.disconnect();
        obs.current = new IntersectionObserver(ents => onIntersect(ents, hasMore, fetchMore));
        obs.current.observe(node);
    }, [loading, hasMore, fetchMore]);
}

function UsersGrid({ users, onNavChange, hasMore, fetchMore, loading }) {
    const self = JSON.parse(localStorage.getItem("user")) || {};
    const filtered = users.filter(u => u.id !== self.id && u.username !== self.username);
    const lastRef = useScrollObserver(loading, hasMore, fetchMore);
    if (!loading && filtered.length === 0) return <div className={styles.emptyState}>No users found. Try adjusting your filters.</div>;
    return (
        <div className={styles.grid}>
            {filtered.map((u, i) => (
                <div key={u.id} ref={i === filtered.length - 1 ? lastRef : null}>
                    <UserCard user={u} onNavChange={onNavChange} />
                </div>
            ))}
        </div>
    );
}

export default function Discover({ onNavChange }) {
    const { loading, users, hasMore, fetchMore, searchQuery, setSearchQuery, containerRef, filterRef, filterState } = useDiscoverSearch();
    const showLoader = loading && users.length === 0;
    return (
        <div className={styles.container}>
            <DiscoverHeader />
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} containerRef={containerRef} filterRef={filterRef} filterState={filterState} />
            {showLoader ? <div className={styles.loadingState}>Loading users...</div> : <UsersGrid users={users} onNavChange={onNavChange} hasMore={hasMore} fetchMore={fetchMore} loading={loading} />}
        </div>
    );
}
