import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Discover.module.css";
import { searchUsers } from "../../api/userService";
import { FilterSection, useSearchInit, useFilterState, useClickOutside } from "../../components/Social/UserSearch";
import { Pagination, BackToTop } from "../../components/Pagination/Pagination";

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

const USERS_PER_PAGE = 16;

async function loadUsers(query, filters, page, setU, setTotalPages, setL) {
    setL(true);
    const offset = (page - 1) * USERS_PER_PAGE;
    const d = await searchUsers(query, filters.mods.join(','), filters.socs.join(','), offset, USERS_PER_PAGE).catch(() => ({ results: [], total_count: 0 }));
    setU(d.results || []);
    setTotalPages(Math.ceil((d.total_count || 0) / USERS_PER_PAGE));
    setL(false);
}

function useDiscoverFetch(query, filterState) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const filterMods = filterState.props.selectedModules.join(',');
    const filterSocs = filterState.props.selectedSocieties.join(',');

    // Reset page when filters or query change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, filterMods, filterSocs]);

    useEffect(() => {
        const filters = { mods: filterState.props.selectedModules, socs: filterState.props.selectedSocieties };
        const timer = setTimeout(() => loadUsers(query, filters, currentPage, setUsers, setTotalPages, setLoading), 300);
        return () => clearTimeout(timer);
    }, [query, filterMods, filterSocs, currentPage]);

    return { loading, users, currentPage, setCurrentPage, totalPages };
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

function UsersGrid({ users, onNavChange, loading, currentPage, totalPages, setCurrentPage }) {
    const self = JSON.parse(localStorage.getItem("user")) || {};
    const filtered = users.filter(u => u.id !== self.id && u.username !== self.username);

    if (!loading && filtered.length === 0) return <div className={styles.emptyState}>No users found. Try adjusting your filters.</div>;

    return (
        <div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            <div className={styles.grid}>
                {filtered.map(u => (
                    <div key={u.id}>
                        <UserCard user={u} onNavChange={onNavChange} />
                    </div>
                ))}
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            <BackToTop />
        </div>
    );
}

export default function Discover({ onNavChange }) {
    const { loading, users, currentPage, setCurrentPage, totalPages, searchQuery, setSearchQuery, containerRef, filterRef, filterState } = useDiscoverSearch();
    const showLoader = loading && users.length === 0;

    return (
        <div className={styles.container}>
            <DiscoverHeader />
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} containerRef={containerRef} filterRef={filterRef} filterState={filterState} />
            {showLoader ? (
                <div className={styles.loadingState}>Loading users...</div>
            ) : (
                <UsersGrid
                    users={users}
                    onNavChange={onNavChange}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                />
            )}
        </div>
    );
}
