import { useState, useMemo } from "react";
import SocietyCard from "../../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import BasePill from "../../components/Tags/BasePill";
import ScrollToTop from "../../components/common/ScrollToTop/ScrollToTop";
import SearchBar from "../../components/common/SearchBar";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { SOCIETY_CATEGORIES, RATIFICATION_FILTERS } from "./societyFilters";

const PAGE_SIZE = 20;

export default function AllSocieties({ onBack, onSelect, societies = [] }) {
    const { search, setSearch, filters, toggleFilter, clearFilters, sortBy, setSortBy } = useFilters();
    const filtered = useMemo(() => filterAndSort(societies, search, filters, sortBy), [societies, search, filters, sortBy]);
    const { visibleItems, hasMore, sentinelRef } = useInfiniteScroll(filtered, PAGE_SIZE);

    return (
        <div className={styles.container}>
            <Header onBack={onBack} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} />
            <FilterPills filters={filters} toggleFilter={toggleFilter} clearFilters={clearFilters} societies={societies} />
            <SocietyGrid items={visibleItems} onSelect={onSelect} />
            {hasMore && <LoadMoreSentinel sentinelRef={sentinelRef} />}
            <ScrollToTop />
        </div>
    );
}

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
    const counts = useCategoryCounts(societies);
    return (
        <div className={styles.pillContainer}>
            <RatificationPills current={filters.ratified} onChange={v => toggleFilter("ratified", v)} societies={societies} />
            <span className={styles.pillDivider} />
            <CategoryPills current={filters.category} onChange={v => toggleFilter("category", v)} counts={counts} />
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

function CategoryPills({ current, onChange, counts }) {
    return SOCIETY_CATEGORIES.map(cat => (
        <BasePill key={cat.id} label={cat.label} count={counts[cat.id] || 0}
            isActive={current === cat.id} onClick={() => onChange(cat.id)} />
    ));
}

function useCategoryCounts(societies) {
    return useMemo(() => buildCategoryCounts(societies), [societies]);
}

function buildCategoryCounts(societies) {
    const counts = {};
    societies.forEach(s => { counts[s.category] = (counts[s.category] || 0) + 1; });
    return counts;
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
    const matchesCategory = filters.category === "all" || society.category === filters.category;
    return matchesSearch && matchesRatified && matchesCategory;
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