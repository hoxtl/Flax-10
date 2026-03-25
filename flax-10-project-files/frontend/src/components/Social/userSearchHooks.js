/*
 * Hooks that drive user search fetching and filter state.
 */

import { useEffect, useRef, useState } from 'react';
import { fetchSocieties } from '../../api/societyApi';
import { useClickOutside } from '../common/hooks/useClickOutside';
import { ROLE_OPTIONS, YEAR_OPTIONS, allCourses } from './userSearchShared';
import { fetchUserResults, filterCourses, filterObj, handleErr, toggleArr } from './userSearchUtils';

export { useClickOutside };

export function useSearchInit(skip) {
    const [allSocieties, setAllSocieties] = useState([]);
    useEffect(() => {
        if (skip) return;
        fetchSocieties().then((response) => setAllSocieties(response.results || response)).catch((error) => handleErr("Societies error", error, setAllSocieties));
    }, [skip]);
    return { allCourses, allSocieties };
}

export function useSearchState(skip) {
    const [query, setQuery] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef(null);
    const initialData = useSearchInit(skip);
    return { query, setQuery, userResults, setUserResults, loading, setLoading, containerRef, ...initialData };
}

function useUserSearchEffects(query, selectedCourses, selectedSocieties, selectedYears, selectedRoles, setUserResults, setLoading) {
    useEffect(() => {
        const args = [query, selectedCourses.join(','), selectedSocieties.join(','), selectedYears.join(','), selectedRoles.join(',')];
        const hasFilters = args.some((value) => value.trim());
        if (!hasFilters) {
            setLoading(false);
            setUserResults([]);
            return;
        }
        const timer = setTimeout(() => fetchUserResults(...args, setUserResults, setLoading), 300);
        return () => clearTimeout(timer);
    }, [query, selectedCourses, selectedSocieties, selectedYears, selectedRoles, setUserResults, setLoading]);
}

function useSelectedFilters() {
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [selectedYears, setSelectedYears] = useState([]);
    const [selectedRoles, setSelectedRoles] = useState([]);
    const [selectedSocieties, setSelectedSocieties] = useState([]);
    return {
        selectedCourses,
        selectedYears,
        selectedRoles,
        selectedSocieties,
        toggleCourse: (course) => setSelectedCourses((current) => toggleArr(current, course)),
        toggleYear: (year) => setSelectedYears((current) => toggleArr(current, year)),
        toggleRole: (role) => setSelectedRoles((current) => toggleArr(current, role)),
        toggleSociety: (id) => setSelectedSocieties((current) => toggleArr(current, id)),
    };
}

function buildFilterProps(activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery, selectedFilters, allSocieties, courseGroups) {
    return {
        activeFilterTab,
        setActiveFilterTab,
        filterQuery,
        setFilterQuery,
        courseGroups,
        courseResults: Object.values(courseGroups).flat(),
        yearResults: YEAR_OPTIONS.filter((year) => !filterQuery || year.toLowerCase().includes(filterQuery.toLowerCase())),
        roleResults: ROLE_OPTIONS.filter((role) => !filterQuery || role.label.toLowerCase().includes(filterQuery.toLowerCase())),
        societyResults: filterObj(allSocieties, filterQuery, ['name']),
        ...selectedFilters,
    };
}

export function useFilterState(allCoursesInput, allSocieties, query, isSearchFocused, userResults, setUserResults, setLoading) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilterTab, setActiveFilterTab] = useState('courses');
    const [filterQuery, setFilterQuery] = useState('');
    const selectedFilters = useSelectedFilters();
    const courseGroups = filterCourses(allCoursesInput, filterQuery);
    useUserSearchEffects(query, selectedFilters.selectedCourses, selectedFilters.selectedSocieties, selectedFilters.selectedYears, selectedFilters.selectedRoles, setUserResults, setLoading);
    return {
        isFilterOpen,
        setIsFilterOpen,
        active: isSearchFocused,
        props: buildFilterProps(activeFilterTab, setActiveFilterTab, filterQuery, setFilterQuery, selectedFilters, allSocieties, courseGroups),
        userResults,
    };
}
