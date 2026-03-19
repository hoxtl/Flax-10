/*
 * Discover page entry point.
 */

import styles from "./Discover.module.css";
import ErrorBoundary from "../../components/common/ErrorBoundary/ErrorBoundary";
import AppPage from "../../components/common/AppPage/AppPage";
import { DiscoverSkeleton, DiscoverToolbar, UsersGrid } from "./DiscoverComponents";
import { useDiscoverSearch } from "./discoverHooks";

function DiscoverContent({ showLoader, users, onNavChange, loading, currentPage, totalPages, setCurrentPage, searchQuery, setSearchQuery }) {
    if (showLoader) return <DiscoverSkeleton />;
    return <UsersGrid users={users} onNavChange={onNavChange} loading={loading} currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
}

export default function Discover({ onNavChange }) {
    const state = useDiscoverSearch();
    const showLoader = state.loading && state.users.length === 0;
    return (
        <ErrorBoundary>
            <AppPage className={styles.container} title="Discover" subtitle="Find course mates and study partners">
                <DiscoverToolbar searchQuery={state.searchQuery} setSearchQuery={state.setSearchQuery} filterRef={state.filterRef} filterState={state.filterState} sortBy={state.sortBy} setSortBy={state.setSortBy} />
                <DiscoverContent showLoader={showLoader} users={state.users} onNavChange={onNavChange} loading={state.loading} currentPage={state.currentPage} totalPages={state.totalPages} setCurrentPage={state.setCurrentPage} searchQuery={state.searchQuery} setSearchQuery={state.setSearchQuery} />
            </AppPage>
        </ErrorBoundary>
    );
}
