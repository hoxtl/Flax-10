import { useState, useEffect, useRef } from "react";
import styles from "./Discover.module.css";
import { searchUsers } from "../../api/userService";
import PageToolbar, { ToolbarSortControl } from "../../components/common/PageToolbar/PageToolbar";
import { SegmentedControl } from "../../components/ui/SegmentedControl";
import { Pagination, BackToTop } from "../../components/Pagination/Pagination";
import ErrorBoundary from "../../components/common/ErrorBoundary/ErrorBoundary";
import UserAvatar from "../../components/common/UserAvatar/UserAvatar";
import EntityLinkChip from "../../components/common/EntityLinkChip/EntityLinkChip";
import { getResolvedUserPhoto } from "../../utils/tutorPhotoFallback";
import AppPage from "../../components/common/AppPage/AppPage";
import GridCard from "../../components/common/Card/GridCard";
import gridStyles from "../../components/common/Card/CardGrid.module.css";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import SearchBar from "../../components/common/SearchBar/SearchBar";
import SearchEmptyState from "../../components/common/SearchEmptyState/SearchEmptyState";
import { FilterSection, useSearchInit, useFilterState, useClickOutside } from "../../components/Social/UserSearch";

function getDisplayName(user) {
    const serverName = (user?.name || "").trim();
    if (serverName) return serverName;
    const baseName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    if (!baseName) return "User";
    return user?.role === "teacher" && !baseName.startsWith("Dr.") ? `Dr. ${baseName}` : baseName;
}

function getRoleLabel(role) {
    if (role === "teacher") return "Teacher";
    if (role === "student") return "Student";
    if (role === "pending_teacher") return "Teacher applicant";
    return "User";
}

function UserCardInfo({ user }) {
    const displayName = getDisplayName(user);
    const isTeacher = user?.role === "teacher" || displayName.startsWith("Dr.");
    const isStudent = user?.role === "student";
    const yearText = isTeacher ? "" : (isStudent ? (user?.year || "") : "");
    const majorText = isTeacher
        ? (user?.major ? `Department: ${user.major}` : "Department: Teaching staff")
        : (user?.major || "");
    const roleLabel = isTeacher ? "Professor" : getRoleLabel(user?.role);
    const roleClass = isTeacher ? styles.teacherPill : isStudent ? styles.studentPill : styles.userRolePill;
    const modules = user?.modules || [];
    return (
        <div className={styles.userInfo}>
            <div className={styles.nameRow}>
                <div className={styles.name}>{displayName}</div>
                <span className={`${styles.rolePill} ${roleClass}`}>{roleLabel}</span>
            </div>
            <EntityLinkChip to={`/profile/${user.id}`} className={styles.username} title={`Open @${user.username}`}>
                @{user.username}
            </EntityLinkChip>
            <div className={styles.courseInfo}>
                {yearText && <span>{yearText}</span>}
                {yearText && majorText && <span> • </span>}
                {majorText && <span>{majorText}</span>}
            </div>
            {user?.bio && <p className={styles.bio}>{user.bio}</p>}
            {modules.length > 0 && (
                <div className={styles.modulePills}>
                    {modules.slice(0, 3).map((code, i) => (
                        <span key={i} className={styles.modulePill}>{code}</span>
                    ))}
                    {modules.length > 3 && <span className={styles.modulePillMore}>+{modules.length - 3}</span>}
                </div>
            )}
        </div>
    );
}

function UserCard({ user, onNavChange }) {
    const avatarUser = {
        ...user,
        profile_photo_url: getResolvedUserPhoto(user, { allowGeneric: true }),
    };
    return (
        <GridCard className={styles.userCard} onClick={() => onNavChange?.("profile_" + user.id)}>
            <UserAvatar user={avatarUser} avatarOnly size={64} />
            <UserCardInfo user={user} />
            <div className={styles.cardFooter}>
                <button type="button" className={styles.viewProfileBtn}>View Profile</button>
            </div>
        </GridCard>
    );
}

const USERS_PER_PAGE = 15;

async function loadUsers(query, filters, page, setU, setTotalPages, setL, sortBy) {
    setL(true);
    const offset = (page - 1) * USERS_PER_PAGE;
    const d = await searchUsers(
        query,
        filters.courses.join(','),
        filters.socs.join(','),
        offset,
        USERS_PER_PAGE,
        filters.years.join(','),
        filters.roles.join(','),
        sortBy
    ).catch(() => ({ results: [], total_count: 0 }));
    setU(d.results || []);
    setTotalPages(Math.ceil((d.total_count || 0) / USERS_PER_PAGE));
    setL(false);
}

function usePaginationReset(query, filterCourses, filterSocs, filterYears, filterRoles) {
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => { setCurrentPage(1); }, [query, filterCourses, filterSocs, filterYears, filterRoles]);
    return { currentPage, setCurrentPage };
}

function useDiscoverFetch(query, filterState, sortBy) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(0);

    const filterCourses = filterState.props.selectedCourses.join(',');
    const filterSocs = filterState.props.selectedSocieties.join(',');
    const filterYears = filterState.props.selectedYears.join(',');
    const filterRoles = (filterState.props.selectedRoles || []).join(',');

    const { currentPage, setCurrentPage } = usePaginationReset(query, filterCourses, filterSocs, filterYears, filterRoles, sortBy);

    useEffect(() => {
        const filters = {
            courses: filterState.props.selectedCourses,
            years: filterState.props.selectedYears,
            socs: filterState.props.selectedSocieties,
            roles: filterState.props.selectedRoles || [],
        };
        const timer = setTimeout(() => {
            loadUsers(query, filters, currentPage, (data) => {
                const sortedData = [...data].sort((a, b) => {
                    const nameA = getDisplayName(a).toLowerCase();
                    const nameB = getDisplayName(b).toLowerCase();
                    if (sortBy === 'name') return nameA.localeCompare(nameB);
                    if (sortBy === 'name-desc') return nameB.localeCompare(nameA);
                    return 0;
                });
                setUsers(sortedData);
            }, setTotalPages, setLoading, sortBy);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, filterCourses, filterSocs, filterYears, filterRoles, currentPage, sortBy]);

    return { loading, users, currentPage, setCurrentPage, totalPages };
}

function useDiscoverUIState(query) {
    const cRef = useRef(null);
    const fRef = useRef(null);
    const { allCourses, allSocieties } = useSearchInit();
    const fS = useFilterState(allCourses, allSocieties, query, true, [], () => { }, () => { });
    useClickOutside(fRef, () => fS.setIsFilterOpen(false));
    return { containerRef: cRef, filterRef: fRef, filterState: fS };
}

function useDiscoverSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const ui = useDiscoverUIState(searchQuery);
    const fetch = useDiscoverFetch(searchQuery, ui.filterState, sortBy);
    return { ...fetch, searchQuery, setSearchQuery, sortBy, setSortBy, ...ui };
}

function DiscoverToolbar({ searchQuery, setSearchQuery, containerRef, filterRef, filterState, sortBy, setSortBy }) {
    const sortOptions = [{ value: 'name', label: 'A → Z' }, { value: 'name-desc', label: 'Z → A' }];
    const toggle = () => filterState.setIsFilterOpen(!filterState.isFilterOpen);
    
    return (
        <PageToolbar
            searchSlot={
                <div ref={containerRef} style={{ width: '100%' }}>
                    <SearchBar placeholder="Search by name or username..." value={searchQuery} onChange={setSearchQuery} />
                </div>
            }
            controlsSlot={
                <>
                    <FilterSection fRef={filterRef} isOpen={filterState.isFilterOpen} setOpen={toggle} props={filterState.props} />
                    <ToolbarSortControl>
                        <SegmentedControl value={sortBy} onChange={setSortBy} options={sortOptions} />
                    </ToolbarSortControl>
                </>
            }
        />
    );
}

function PaginatedGrid({ filtered, onNavChange, currentPage, totalPages, setCurrentPage }) {
    return (
        <div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            <div className={gridStyles.grid}>
                {filtered.map(u => <div key={u.id}><UserCard user={u} onNavChange={onNavChange} /></div>)}
            </div>
            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
            <BackToTop />
        </div>
    );
}

function UsersGrid({ users, onNavChange, loading, currentPage, totalPages, setCurrentPage, searchQuery, setSearchQuery }) {
    const self = JSON.parse(localStorage.getItem("user")) || {};
    const filtered = users.filter(u => u.id !== self.id && u.username !== self.username);
    if (!loading && filtered.length === 0) {
        if (String(searchQuery || "").trim()) {
            return (
                <SearchEmptyState
                    query={searchQuery}
                    itemLabel="users"
                    onClear={() => setSearchQuery("")}
                />
            );
        }
        return <EmptyState icon="👥" title="No users found" description="Try adjusting your search or filters." />;
    }
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

export default function Discover({ onNavChange, onBack }) {
    const { loading, users, currentPage, setCurrentPage, totalPages, searchQuery, setSearchQuery, containerRef, filterRef, filterState, sortBy, setSortBy } = useDiscoverSearch();
    const showLoader = loading && users.length === 0;

    const toolbar = (
        <DiscoverToolbar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            containerRef={containerRef} 
            filterRef={filterRef} 
            filterState={filterState}
            sortBy={sortBy}
            setSortBy={setSortBy}
        />
    );
    
    const content = showLoader
        ? <DiscoverSkeleton />
        : <UsersGrid
            users={users}
            onNavChange={onNavChange}
            loading={loading}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        />;

    return (
        <ErrorBoundary>
            <AppPage 
                className={styles.container} 
                title="Discover" 
                subtitle="Find course mates and study partners"
            >
                {toolbar}
                {content}
            </AppPage>
        </ErrorBoundary>
    );
}
