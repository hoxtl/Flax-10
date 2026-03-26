/*
 * Presentational Discover page components.
 */

import { SegmentedControl } from "../../components/common";
import GridCard from "../../components/common/card/GridCard";
import gridStyles from "../../components/common/card/CardGrid.module.css";
import EmptyState from "../../components/common/empty_state/EmptyState";
import EntityLinkChip from "../../components/common/entity_link_chip/EntityLinkChip";
import PageToolbar, { ToolbarSortControl } from "../../components/common/page_toolbar/PageToolbar";
import PrimaryButton from "../../components/common/primary_button/PrimaryButton";
import SearchBar from "../../components/common/search_bar/SearchBar";
import SearchEmptyState from "../../components/common/search_empty_state/SearchEmptyState";
import UserAvatar from "../../components/common/user_avatar/UserAvatar";
import { FilterSection } from "../../components/social/UserSearch";
import { BackToTop, Pagination } from "../../components/pagination/Pagination";
import { getResolvedUserPhoto } from "../../utils/tutorPhotoFallback";
import { filterVisibleUsers, getDiscoverSortOptions, getDisplayName, getRoleLabel } from "./discoverHelpers";
import styles from "./Discover.module.css";

function UserCardHeader({ displayName, roleLabel, roleClass }) {
  return <div className={styles.nameRow}><div className={styles.name}>{displayName}</div><span className={`${styles.rolePill} ${roleClass}`}>{roleLabel}</span></div>;
}

function CourseInfo({ yearText, majorText }) {
  return <div className={styles.courseInfo}>{yearText && <span>{yearText}</span>}{yearText && majorText && <span> • </span>}{majorText && <span>{majorText}</span>}</div>;
}

function ModulePills({ modules }) {
  if (modules.length === 0) return null;
  return <div className={styles.modulePills}>{modules.slice(0, 3).map((code, index) => <span key={index} className={styles.modulePill}>{code}</span>)}{modules.length > 3 && <span className={styles.modulePillMore}>+{modules.length - 3}</span>}</div>;
}

function getUserMeta(user, displayName) {
  const isTeacher = user?.role === "teacher" || displayName.startsWith("Dr.");
  const isStudent = user?.role === "student";
  return { yearText: isStudent ? user?.year || "" : "", majorText: isTeacher ? user?.major ? `Department: ${user.major}` : "Department: Teaching staff" : user?.major || "", roleLabel: isTeacher ? "Professor" : getRoleLabel(user?.role), roleClass: isTeacher ? styles.teacherPill : isStudent ? styles.studentPill : styles.userRolePill };
}

function UserCardInfo({ user }) {
  const displayName = getDisplayName(user);
  const info = getUserMeta(user, displayName);
  return (
    <div className={styles.userInfo}>
      <UserCardHeader displayName={displayName} roleLabel={info.roleLabel} roleClass={info.roleClass} />
      <EntityLinkChip to={`/profile/${user.id}`} className={styles.username} title={`Open @${user.username}`}>@{user.username}</EntityLinkChip>
      <CourseInfo yearText={info.yearText} majorText={info.majorText} />
      {user?.bio && <p className={styles.bio}>{user.bio}</p>}
      <ModulePills modules={user?.modules || []} />
    </div>
  );
}

function OpenProfileButton({ onOpen }) {
  return <PrimaryButton type="button" className={styles.viewProfileBtn} pill onClick={(event) => stopEventAndRun(event, onOpen)}>View Profile</PrimaryButton>;
}

function stopEventAndRun(event, callback) {
  event.stopPropagation();
  callback();
}

function UserCard({ user, onNavChange }) {
  const avatarUser = { ...user, profile_photo_url: getResolvedUserPhoto(user, { allowGeneric: true }) };
  const openProfile = () => onNavChange?.(`profile_${user.id}`);
  return (
    <GridCard className={styles.userCard} onClick={openProfile}>
      <UserAvatar user={avatarUser} avatarOnly size={64} />
      <UserCardInfo user={user} />
      <div className={styles.cardFooter}><OpenProfileButton onOpen={openProfile} /></div>
    </GridCard>
  );
}

function DiscoverToolbarControls({ filterRef, filterState, sortBy, setSortBy }) {
  const openFilters = () => filterState.setIsFilterOpen(true);
  const closeFilters = () => filterState.setIsFilterOpen(false);
  const toggleFilter = () => filterState.setIsFilterOpen(!filterState.isFilterOpen);
  return <><FilterSection fRef={filterRef} isOpen={filterState.isFilterOpen} setOpen={toggleFilter} onOpen={openFilters} onClose={closeFilters} props={filterState.props} /><ToolbarSortControl><SegmentedControl value={sortBy} onChange={setSortBy} options={getDiscoverSortOptions()} /></ToolbarSortControl></>;
}

export function DiscoverToolbar({ searchQuery, setSearchQuery, filterRef, filterState, sortBy, setSortBy }) {
  return <PageToolbar searchSlot={<SearchBar placeholder="Search by name or username..." value={searchQuery} onChange={setSearchQuery} />} controlsSlot={<DiscoverToolbarControls filterRef={filterRef} filterState={filterState} sortBy={sortBy} setSortBy={setSortBy} />} />;
}

function PaginatedGrid({ users, onNavChange, currentPage, totalPages, setCurrentPage }) {
  return (
    <div>
      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      <div className={gridStyles.grid}>{users.map((user) => <div key={user.id}><UserCard user={user} onNavChange={onNavChange} /></div>)}</div>
      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
      <BackToTop containerSelector="[data-dashboard-main]" />
    </div>
  );
}

function EmptyUsersState({ searchQuery }) {
  if (String(searchQuery || "").trim()) return <SearchEmptyState query={searchQuery} itemLabel="users" />;
  return <EmptyState icon="👥" title="No users found" description="Try adjusting your search or filters." />;
}

export function UsersGrid({ users, onNavChange, loading, currentPage, totalPages, setCurrentPage, searchQuery }) {
  const visibleUsers = filterVisibleUsers(users);
  if (!loading && visibleUsers.length === 0) return <EmptyUsersState searchQuery={searchQuery} />;
  return <PaginatedGrid users={visibleUsers} onNavChange={onNavChange} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />;
}

function DiscoverSkeletonCard({ index }) {
  return <div className={styles.skelUserCard} style={{ animationDelay: `${index * 0.06}s` }}><div className={`${styles.skel} ${styles.skelAvatar}`} /><div className={`${styles.skel} ${styles.skelName}`} /><div className={`${styles.skel} ${styles.skelUsername}`} /></div>;
}

export function DiscoverSkeleton() {
  return <div className={styles.skelWrap}>{[...Array(8)].map((_, index) => <DiscoverSkeletonCard key={index} index={index} />)}</div>;
}
