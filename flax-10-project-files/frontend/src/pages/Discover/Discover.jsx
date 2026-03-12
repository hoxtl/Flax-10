import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Discover.module.css";
import { searchUsers } from "../../api/userService";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import { FilterSection, useSearchInit, useFilterState, useClickOutside } from "../../components/Social/UserSearch";
import { Pagination, BackToTop } from "../../components/Pagination/Pagination";

import UserAvatar from "../../components/common/UserAvatar/UserAvatar";

function UserCardInfo({ user }) {
    return (
        <div className={styles.userInfo}>
            <div className={styles.name}>{user.first_name} {user.last_name}</div>
            <div className={styles.username}>@{user.username}</div>
            <div className={styles.courseInfo}>
                {user.year && <span>{user.year}</span>}
                {user.major && <span> • {user.major}</span>}
            </div>
        </div>
    );
}

function UserCard({ user, onNavChange }) {
    return (
        <div className={styles.userCard} onClick={() => onNavChange?.("profile_" + user.id)}>
            <div style={{ marginBottom: 16 }}>
                <UserAvatar user={user} avatarOnly size={80} />
            </div>
            <UserCardInfo user={user} />
        </div>
    );
}

const USERS_PER_PAGE = 16;

async function loadUsers(query, filters, page, setU, setTotalPages, setL) {
    setL(true);
    const offset = (page - 1) * USERS_PER_PAGE;
    const d = await searchUsers(query, filters.courses.join(','), filters.socs.join(','), offset, USERS_PER_PAGE, filters.years.join(',')).catch(() => ({ results: [], total_count: 0 }));
    setU(d.results || []);
    setTotalPages(Math.ceil((d.total_count || 0) / USERS_PER_PAGE));
    setL(false);
}

function usePaginationReset(query, filterCourses, filterSocs, filterYears) {
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => { setCurrentPage(1); }, [query, filterCourses, filterSocs, filterYears]);
    return { currentPage, setCurrentPage };
}

function useDiscoverFetch(query, filterState) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(0);

    const filterCourses = filterState.props.selectedCourses.join(',');
    const filterSocs = filterState.props.selectedSocieties.join(',');
    const filterYears = filterState.props.selectedYears.join(',');

    const { currentPage, setCurrentPage } = usePaginationReset(query, filterCourses, filterSocs, filterYears);

    useEffect(() => {
        const filters = {
            courses: filterState.props.selectedCourses,
            years: filterState.props.selectedYears,
            socs: filterState.props.selectedSocieties,
        };
        const timer = setTimeout(() => loadUsers(query, filters, currentPage, setUsers, setTotalPages, setLoading), 300);
        return () => clearTimeout(timer);
    }, [query, filterCourses, filterSocs, filterYears, currentPage]);

    return { loading, users, currentPage, setCurrentPage, totalPages };
}

function useDiscoverUIState(query) {
    const [res, setRes] = useState([]);
    const [sL, setSL] = useState(false);
    const [pos, setPos] = useState(null);
    const cRef = useRef(null);
    const fRef = useRef(null);
    const { allCourses, allSocieties } = useSearchInit();
    const fS = useFilterState(allCourses, allSocieties, query, true, cRef, res, setPos, setRes, setSL);
    useClickOutside(fRef, () => fS.setIsFilterOpen(false));
    return { containerRef: cRef, filterRef: fRef, filterState: fS };
}

function useDiscoverSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const ui = useDiscoverUIState(searchQuery);
    const fetch = useDiscoverFetch(searchQuery, ui.filterState);
    return { ...fetch, searchQuery, setSearchQuery, ...ui };
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

function PaginatedGrid({ filtered, onNavChange, currentPage, totalPages, setCurrentPage }) {
    return (
        <div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            <div className={styles.grid}>
                {filtered.map(u => <div key={u.id}><UserCard user={u} onNavChange={onNavChange} /></div>)}
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            <BackToTop />
        </div>
    );
}

function UsersGrid({ users, onNavChange, loading, currentPage, totalPages, setCurrentPage }) {
    const self = JSON.parse(localStorage.getItem("user")) || {};
    const filtered = users.filter(u => u.id !== self.id && u.username !== self.username);
    if (!loading && filtered.length === 0) return <EmptyState icon="👥" title="No users found" description="Try adjusting your search or filters." />;
    return <PaginatedGrid filtered={filtered} onNavChange={onNavChange} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />;
}

function DiscoverSkeleton() {
  return (
    <div className={styles.skelWrap}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className={styles.skelUserCard} style={{ animationDelay: `${i * 0.06}s` }}>
          <div className={`${styles.skel} ${styles.skelAvatar}`} />
          <div className={`${styles.skel} ${styles.skelName}`} />
          <div className={`${styles.skel} ${styles.skelUsername}`} />
        </div>
      ))}
    </div>
  );
}

export default function Discover({ onNavChange }) {
    const { loading, users, currentPage, setCurrentPage, totalPages, searchQuery, setSearchQuery, containerRef, filterRef, filterState } = useDiscoverSearch();
    const showLoader = loading && users.length === 0;

    const srch = <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} containerRef={containerRef} filterRef={filterRef} filterState={filterState} />;
    const content = showLoader ? <DiscoverSkeleton /> : <UsersGrid users={users} onNavChange={onNavChange} loading={loading} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />;

    return (
        <div className={styles.container}>
            <PageHeader title="Discover" subtitle="Find course mates and study partners" />
            {srch}
            {content}
        </div>
    );
}
