/*
 * Discover page hooks for filters, fetches, and pagination.
 */

import { useEffect, useRef, useState } from "react";
import { searchUsers } from "../../api/userService";
import { useClickOutside, useFilterState, useSearchInit } from "../../components/Social/UserSearch";
import { sortDiscoverUsers, USERS_PER_PAGE } from "./discoverHelpers";

async function loadUsers(query, filters, page, setUsers, setTotalPages, setLoading, sortBy) {
    setLoading(true);
    const offset = (page - 1) * USERS_PER_PAGE;
    const data = await searchUsers(query, filters.courses.join(','), filters.socs.join(','), offset, USERS_PER_PAGE, filters.years.join(','), filters.roles.join(','), sortBy).catch(() => ({ results: [], total_count: 0 }));
    setUsers(sortDiscoverUsers(data.results || [], sortBy));
    setTotalPages(Math.ceil((data.total_count || 0) / USERS_PER_PAGE));
    setLoading(false);
}

function usePaginationReset(query, filterCourses, filterSocs, filterYears, filterRoles) {
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        setCurrentPage(1);
    }, [query, filterCourses, filterSocs, filterYears, filterRoles]);
    return { currentPage, setCurrentPage };
}

function getJoinedFilterValues(filterState) {
    const props = filterState.props;
    return {
        filterCourses: props.selectedCourses.join(','),
        filterSocs: props.selectedSocieties.join(','),
        filterYears: props.selectedYears.join(','),
        filterRoles: (props.selectedRoles || []).join(','),
    };
}

export function useDiscoverFetch(query, filterState, sortBy) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const joinedFilters = getJoinedFilterValues(filterState);
    const { currentPage, setCurrentPage } = usePaginationReset(query, joinedFilters.filterCourses, joinedFilters.filterSocs, joinedFilters.filterYears, joinedFilters.filterRoles);
    useEffect(() => {
        const filters = { courses: filterState.props.selectedCourses, years: filterState.props.selectedYears, socs: filterState.props.selectedSocieties, roles: filterState.props.selectedRoles || [] };
        const timer = setTimeout(() => loadUsers(query, filters, currentPage, setUsers, setTotalPages, setLoading, sortBy), 300);
        return () => clearTimeout(timer);
    }, [query, joinedFilters.filterCourses, joinedFilters.filterSocs, joinedFilters.filterYears, joinedFilters.filterRoles, currentPage, sortBy, filterState.props.selectedCourses, filterState.props.selectedSocieties, filterState.props.selectedYears, filterState.props.selectedRoles]);
    return { loading, users, currentPage, setCurrentPage, totalPages };
}

function useDiscoverUIState(query) {
    const containerRef = useRef(null);
    const filterRef = useRef(null);
    const searchData = useSearchInit();
    const filterState = useFilterState(searchData.allCourses, searchData.allSocieties, query, true, [], () => {}, () => {});
    useClickOutside(filterRef, () => filterState.setIsFilterOpen(false));
    return { containerRef, filterRef, filterState };
}

export function useDiscoverSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const uiState = useDiscoverUIState(searchQuery);
    const fetchState = useDiscoverFetch(searchQuery, uiState.filterState, sortBy);
    return { ...fetchState, searchQuery, setSearchQuery, sortBy, setSortBy, ...uiState };
}
