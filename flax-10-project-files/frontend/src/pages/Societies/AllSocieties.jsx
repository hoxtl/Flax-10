import { useState, useMemo } from "react";
import SocietyCard from "../../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import BasePill from "../../components/Tags/BasePill";
import ScrollToTop from "../../components/common/ScrollToTop/ScrollToTop";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination/Pagination";
import { SOCIETY_CATEGORIES, RATIFICATION_FILTERS, matchesCategory, countByCategory } from "./societyFilters";

const PAGE_SIZE = 20;

export default function AllSocieties({ onBack, onSelect, societies = [] }) {
    const { search, setSearch, filters, toggleFilter, clearFilters, sortBy, setSortBy, page, setPage } = useFilters();
    const filtered = useMemo(() => filterAndSort(societies, search, filters, sortBy), [societies, search, filters, sortBy]);
    const { items, totalPages } = usePagination(filtered, page, PAGE_SIZE);

    return (
        <div className={styles.container}>
            <Header onBack={onBack} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} />
            <FilterPills filters={filters} toggleFilter={toggleFilter} clearFilters={clearFilters} societies={societies} />
            <SocietyGrid items={items} onSelect={onSelect} />
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            <ScrollToTop />
        </div>
    );
}

function usePagination(items, page, pageSize) {
    const totalPages = Math.ceil(items.length / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);
    return { items: paginatedItems, totalPages };
}

function useFilters() {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ ratified: "all", category: "all" });
    const [sortBy, setSortBy] = useState("name");
    const [page, setPage] = useState(1);

    const handleSearch = (value) => { setSearch(value); setPage(1); };
    const handleSort = (value) => { setSortBy(value); setPage(1); };
    const toggleFilter = (type, value) => { setFilters(prev => toggleFilterValue(prev, type, value)); setPage(1); };
    const clearFilters = () => { setFilters({ ratified: "all", category: "all" }); setPage(1); };

    return { search, setSearch: handleSearch, filters, toggleFilter, clearFilters, sortBy, setSortBy: handleSort, page, setPage };
}

function toggleFilterValue(prev, type, value) {
    const newValue = prev[type] === value ? "all" : value;
    return { ...prev, [type]: newValue };
}

function Header({ onBack, search, setSearch, sortBy, setSortBy }) {
    return (
        <header className={styles.header}>
            <button onClick={onBack} className={styles.backBtn}>← Back</button>
            <SearchBar value={search} onChange={setSearch} placeholder="Search societies..." />
            <SortDropdown value={sortBy} onChange={setSortBy} />
        </header>
    );
}

function SortDropdown({ value, onChange }) {
    return (
        <select className={styles.sortDropdown} value={value} onChange={e => onChange(e.target.value)}>
            <option value="name">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="newest">Newest</option>
            <option value="members">Most Members</option>
        </select>
    );
}

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

function SocietyGrid({ items, onSelect }) {
    if (items.length === 0) return <EmptyState />;
    return (
        <div className={styles.grid}>
            {items.map(s => <SocietyCard key={s.id} society={s} onClick={() => onSelect?.(s)} />)}
        </div>
    );
}

function LoadMoreSentinel({ sentinelRef }) {
    return <div ref={sentinelRef} className={styles.loadingIndicator}>Scroll for more...</div>;
}

function EmptyState() {
    return <div className={styles.emptyContainer}><p className={styles.emptyText}>No societies found.</p></div>;
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