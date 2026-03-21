/*
 * useSocietyBrowseFilters owns search, filter, and sort state for society browsing.
 */
import { useState } from "react";

const DEFAULT_FILTERS = { ratified: "all", category: [] };

export function useSocietyBrowseFilters() {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [sortBy, setSortBy] = useState("name");
    return {
        search,
        setSearch,
        filters,
        sortBy,
        setSortBy,
        toggleFilter: (type, value) => setFilters((prev) => toggleFilterValue(prev, type, value)),
        setCategory: (tags) => setFilters((prev) => ({ ...prev, category: tags })),
        clearFilters: () => setFilters(DEFAULT_FILTERS),
    };
}

function toggleFilterValue(prev, type, value) {
    const nextValue = prev[type] === value ? "all" : value;
    return { ...prev, [type]: nextValue };
}
