import { useState, useMemo } from "react";
import SocietyCard from "../../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import BasePill from "../../components/Tags/BasePill";
import ScrollToTop from "../../components/common/ScrollToTop/ScrollToTop";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { SOCIETY_CATEGORIES, RATIFICATION_FILTERS } from "./societyFilters";

export default function AllSocieties({ onBack, onSelect, societies = [] }) {
    const { search, setSearch, filters, toggleFilter, clearFilters, sortBy, setSortBy } = useFilters();
    const filtered = useMemo(() => filterAndSort(societies, search, filters, sortBy), [societies, search, filters, sortBy]);
    const { visibleItems, hasMore, sentinelRef, pageBreaks } = useInfiniteScroll(filtered);

    return (
        <div className={styles.container}>
            <Header onBack={onBack} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} />
            <FilterBar filters={filters} toggleFilter={toggleFilter} clearFilters={clearFilters} societies={societies} />
            <SocietyGrid items={visibleItems} onSelect={onSelect} hasMore={hasMore} sentinelRef={sentinelRef} />
            <ScrollToTop pageBreaks={pageBreaks} />
        </div>
    );
}

function useFilters() {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ ratified: "all", category: "all" });
    const [sortBy, setSortBy] = useState("name");
    const toggleFilter = (type, value) => setFilters(prev => ({ ...prev, [type]: value }));
    const clearFilters = () => setFilters({ ratified: "all", category: "all" });
    return { search, setSearch, filters, toggleFilter, clearFilters, sortBy, setSortBy };
}

function Header({ onBack, search, setSearch, sortBy, setSortBy }) {
    return (
        <header className={styles.header}>
            <button onClick={onBack} className={styles.backBtn}>← Back</button>
            <input className={styles.searchBar} value={search} placeholder="Search societies..."
                onChange={e => setSearch(e.target.value)} />
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

function FilterBar({ filters, toggleFilter, clearFilters, societies }) {
    const hasActiveFilters = filters.ratified !== "all" || filters.category !== "all";
    return (
        <div className={styles.filterBar}>
            <RatificationFilters current={filters.ratified} onChange={v => toggleFilter("ratified", v)} societies={societies} />
            <CategoryDropdown current={filters.category} onChange={v => toggleFilter("category", v)} />
            {hasActiveFilters && <button className={styles.clearPill} onClick={clearFilters}>Clear x</button>}
        </div>
    );
}

function RatificationFilters({ current, onChange, societies }) {
    return (
        <div className={styles.pillContainer}>
            {RATIFICATION_FILTERS.map(opt => (
                <BasePill key={opt.id} label={opt.label} count={countForFilter(societies, opt.id)}
                    isActive={current === opt.id} onClick={() => onChange(opt.id)} />
            ))}
        </div>
    );
}

function CategoryDropdown({ current, onChange }) {
    return (
        <select className={styles.categoryDropdown} value={current} onChange={e => onChange(e.target.value)}>
            <option value="all">All Categories</option>
            {SOCIETY_CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
        </select>
    );
}

function SocietyGrid({ items, onSelect, hasMore, sentinelRef }) {
    if (items.length === 0) return <EmptyState />;
    return (
        <>
            <div className={styles.grid}>
                {items.map(s => <SocietyCard key={s.id} society={s} onClick={() => onSelect?.(s)} />)}
            </div>
            {hasMore && <div ref={sentinelRef} className={styles.loadingIndicator}>Loading more...</div>}
        </>
    );
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