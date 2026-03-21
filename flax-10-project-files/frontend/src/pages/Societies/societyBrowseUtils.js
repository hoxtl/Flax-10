/*
 * societyBrowseUtils contains pure filtering and sorting helpers for the browse page.
 */
import { matchesCategory } from "./societyFilters";

export function countForFilter(societies, filterId) {
    if (filterId === "all") return societies.length;
    if (filterId === "ratified") return societies.filter((society) => society.is_ratified).length;
    return societies.filter((society) => !society.is_ratified).length;
}

export function filterAndSort(list, search, filters, sortBy) {
    return sortSocieties(list.filter((society) => matchesAllFilters(society, search, filters)), sortBy);
}

function matchesAllFilters(society, search, filters) {
    const matchesSearch = society.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !filters.category.length || filters.category.some(cat => matchesCategory(society, cat.id));
    return matchesSearch && matchesRatification(society, filters.ratified) && matchesCat;
}

function matchesRatification(society, filter) {
    if (filter === "all") return true;
    return filter === "ratified" ? society.is_ratified : !society.is_ratified;
}

function sortSocieties(list, sortBy) {
    const sorted = [...list];
    if (sortBy === "name") return sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name-desc") return sorted.sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === "newest") return sorted.sort((a, b) => b.id - a.id);
    if (sortBy === "members") return sorted.sort((a, b) => (b.member_count || 0) - (a.member_count || 0));
    return sorted;
}
