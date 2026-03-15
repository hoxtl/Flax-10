/**
 * AllSocieties provides an exploration view for all available societies.
 * Features comprehensive filtering by category, ratification status, and search.
 */
import { useState, useMemo } from "react";
import SocietyCard from "../../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import gridStyles from "../../components/common/Card/CardGrid.module.css";
import EmptyState from "../../components/common/EmptyState/EmptyState";
import SearchEmptyState from "../../components/common/SearchEmptyState/SearchEmptyState";
import { ToolbarSortControl } from "../../components/common/PageToolbar/PageToolbar";
import BasePill from "../../components/Tags/BasePill";
import SearchBar from "../../components/common/SearchBar";
import AnimatedDropdown from "../../components/common/AnimatedDropdown";
import { Pagination, BackToTop } from "../../components/Pagination/Pagination";
import { SOCIETY_CATEGORIES, RATIFICATION_FILTERS, matchesCategory, countByCategory } from "./societyFilters";
import { usePagination } from "../../hooks/usePagination";

const PAGE_SIZE = 20;

/** Exploratory view for the full directory of societies. */
export default function AllSocieties({ onBack, onSelect, societies = [], onReport, onUnreport }) {
    const filterState = useFilters();
    const { search, filters, sortBy, setSearch, setSortBy } = filterState;

    const filtered = useMemo(() =>
        filterAndSort(societies, search, filters, sortBy),
        [societies, search, filters, sortBy]
    );

    return (
        <div className={styles.container}>
            <Header onBack={onBack} search={search} setSearch={setSearch}
                sortBy={sortBy} setSortBy={setSortBy} />
            <FilterPills {...filterState} societies={societies} />
            <PaginatedGrid items={filtered} search={search} setSearch={setSearch} onSelect={onSelect}
                onReport={onReport} onUnreport={onUnreport} />
            <BackToTop />
        </div>
    );
}

/** State manager for all-societies filtering and sorting. */
function useFilters() {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ ratified: "all", category: "all" });
    const [sortBy, setSortBy] = useState("name");

    const toggleFilter = (type, value) => setFilters(prev => toggleFilterValue(prev, type, value));
    const clearFilters = () => setFilters({ ratified: "all", category: "all" });

    return { search, setSearch, filters, toggleFilter, clearFilters, sortBy, setSortBy };
}

function toggleFilterValue(prev, type, value) {
    const newValue = prev[type] === value ? "all" : value;
    return { ...prev, [type]: newValue };
}

/** Header section for the all-societies view. */
function Header({ onBack, search, setSearch, sortBy, setSortBy }) {
    return (
        <>
            <header className={styles.header}>
                <button onClick={onBack} className={styles.backBtn}>← Back</button>
            </header>
            <div className={styles.browseToolbar}>
                <div className={styles.browseSearch}>
                    <SearchBar value={search} onChange={setSearch} placeholder="Search societies..." />
                </div>
                <ToolbarSortControl className={styles.browseSortControl}>
                    <SortDropdown value={sortBy} onChange={setSortBy} />
                </ToolbarSortControl>
            </div>
        </>
    );
}

const SORT_OPTIONS = [
    { value: "name", label: "A-Z" },
    { value: "name-desc", label: "Z-A" },
    { value: "newest", label: "Newest" },
    { value: "members", label: "Most Members" },
];

function SortDropdown({ value, onChange }) {
    return (
        <AnimatedDropdown className={styles.sortDropdown} value={value} onChange={onChange} options={SORT_OPTIONS} placeholder="Sort by" />
    );
}

/** Collection of category and status filter pills. */
function FilterPills({ filters, toggleFilter, clearFilters, societies }) {
    const hasActiveFilters = filters.ratified !== "all" || filters.category !== "all";
    return (
        <div className={styles.pillContainer}>
            <RatificationPills current={filters.ratified} onChange={v => toggleFilter("ratified", v)} societies={societies} />
            <span className={styles.pillDivider} />
            <CategoryPills current={filters.category} onChange={v => toggleFilter("category", v)} societies={societies} />
            {hasActiveFilters && <button className={styles.clearPill} onClick={clearFilters}>Clear x</button>}
        </div>
    );
}

function RatificationPills({ current, onChange, societies }) {
    return RATIFICATION_FILTERS.map(opt => (
        <BasePill key={opt.id} label={`${countForFilter(societies, opt.id)} ${opt.label}`}
            isActive={current === opt.id} onClick={() => onChange(opt.id)} />
    ));
}

function CategoryPills({ current, onChange, societies }) {
    return SOCIETY_CATEGORIES.map(cat => (
        <BasePill key={cat.id} label={cat.label} count={countByCategory(societies, cat.id)}
            isActive={current === cat.id} onClick={() => onChange(cat.id)} />
    ));
}

/** Renders the results grid with integrated pagination. */
function PaginatedGrid({ items, search, setSearch, onSelect, onReport, onUnreport }) {
    const { currentItems, totalPages, currentPage, setPage } = usePagination(items, PAGE_SIZE);
    if (items.length === 0) {
        if (String(search || "").trim()) {
            return (
                <SearchEmptyState
                    query={search}
                    itemLabel="societies"
                    emoji="🔎"
                    hint="Try a different keyword or check your spelling"
                    onClear={() => setSearch("")}
                />
            );
        }
        return <EmptyState icon="🎭" title="No societies found"
            description="Try adjusting your search or filters." />;
    }
    return (
        <>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            <div className={gridStyles.grid}>
                {currentItems.map(s => (
                    <SocietyCard key={s.id} society={s} onClick={onSelect}
                        onReport={onReport} onUnreport={onUnreport} />
                ))}
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
    );
}

function countForFilter(societies, filterId) {
    if (filterId === "all") return societies.length;
    if (filterId === "ratified") return societies.filter(s => s.is_ratified).length;
    return societies.filter(s => !s.is_ratified).length;
}

function filterAndSort(list, search, filters, sortBy) {
    const filtered = list.filter(s => matchesAllFilters(s, search, filters));
    return sortSocieties(filtered, sortBy);
}

function matchesAllFilters(society, search, filters) {
    const matchesSearch = society.name.toLowerCase().includes(search.toLowerCase());
    const matchesRatified = matchesRatification(society, filters.ratified);
    const categoryMatch = matchesCategory(society, filters.category);
    return matchesSearch && matchesRatified && categoryMatch;
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
