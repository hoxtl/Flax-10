/*
 * AllSocieties renders the browse view for exploring the full societies directory.
 */
import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter } from "lucide-react";
import SocietyCard from "../../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import { ToolbarSortControl } from "../../components/common/PageToolbar/PageToolbar";
import SearchBar from "../../components/common/SearchBar";
import AnimatedDropdown from "../../components/common/AnimatedDropdown";
import { Pagination, BackToTop } from "../../components/Pagination/Pagination";
import { TagsSelector } from "../../components/common/TagsSelector/TagsSelector";
import { SOCIETY_CATEGORIES, matchesCategory } from "./societyFilters";
import { usePagination } from "../../hooks/usePagination";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
import { SOCIETY_CATEGORIES, RATIFICATION_FILTERS, countByCategory } from "./societyFilters";
import { SocietyBrowseResults } from "./SocietyBrowseResults";
import { useSocietyBrowseFilters } from "./useSocietyBrowseFilters";
import { countForFilter, filterAndSort } from "./societyBrowseUtils";

/** Exploratory view for the full directory of societies. */
export default function AllSocieties({ onBack, onSelect, societies = [], onReport, onUnreport }) {
    const filterState = useSocietyBrowseFilters();
    const { search, filters, sortBy } = filterState;
    const filtered = useMemo(() => filterAndSort(societies, search, filters, sortBy), [societies, search, filters, sortBy]);
    return <BrowseLayout filterState={filterState} filtered={filtered} societies={societies} onBack={onBack} onSelect={onSelect} onReport={onReport} onUnreport={onUnreport} />;
}

function BrowseLayout({ filterState, filtered, societies, onBack, onSelect, onReport, onUnreport }) {
    const { search, sortBy, setSearch, setSortBy } = filterState;
    return (
        <div className={styles.container}>
            <Header onBack={onBack} search={search} setSearch={setSearch}
                sortBy={sortBy} setSortBy={setSortBy} filterState={filterState} />
            <PaginatedGrid items={filtered} search={search} setSearch={setSearch} onSelect={onSelect}
                onReport={onReport} onUnreport={onUnreport} />
            <BackToTop />
        </div>
    );
}

/** State manager for all-societies filtering and sorting. */
function useFilters() {
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({ ratified: "all", categories: [] });
    const [sortBy, setSortBy] = useState("name");

    const toggleRatified = (value) => setFilters(prev => ({ ...prev, ratified: prev.ratified === value ? "all" : value }));
    const setCategories = (cats) => setFilters(prev => ({ ...prev, categories: cats }));
    const clearFilters = () => setFilters({ ratified: "all", categories: [] });

    return { search, setSearch, filters, toggleRatified, setCategories, clearFilters, sortBy, setSortBy };
}

/** Header section for the all-societies view. */
function Header({ onBack, search, setSearch, sortBy, setSortBy, filterState }) {
    return (
        <>
            <header className={styles.header}>
                <BackButton onClick={onBack} label="Back" />
            </header>
            <div className={styles.browseToolbar}>
                <div className={styles.browseSearch}>
                    <SearchBar value={search} onChange={setSearch} placeholder="Search societies..." />
                </div>
                <div className={styles.browseControls}>
                    <SocietyFilterButton filterState={filterState} />
                    <ToolbarSortControl className={styles.browseSortControl}>
                        <SortDropdown value={sortBy} onChange={setSortBy} />
                    </ToolbarSortControl>
                </div>
            </div>
        </>
    );
}

const CATEGORY_TAGS = SOCIETY_CATEGORIES.map(c => ({ id: c.id, label: c.label }));

const RATIFICATION_OPTS = [
    { value: "all", label: "All" },
    { value: "ratified", label: "Ratified" },
    { value: "unratified", label: "Unratified" },
];

function SocietyFilterButton({ filterState }) {
    const { filters, setCategories, toggleRatified } = filterState;
    const [isOpen, setIsOpen] = useState(false);
    const wrapRef = useRef(null);

    const selectedTagObjects = CATEGORY_TAGS.filter(t => filters.categories.includes(t.id));
    const handleCategoryChange = (newSelected) => setCategories(newSelected.map(t => t.id));
    const activeCount = filters.categories.length + (filters.ratified !== "all" ? 1 : 0);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const hoverTimer = useRef(null);
    const handleMouseEnter = () => { clearTimeout(hoverTimer.current); if (!isOpen) setIsOpen(true); };
    const handleMouseLeave = () => { hoverTimer.current = setTimeout(() => setIsOpen(false), 200); };
    useEffect(() => () => clearTimeout(hoverTimer.current), []);

    return (
        <div className={styles.categoryFilterWrap} ref={wrapRef}
            onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
                type="button"
                className={`${styles.categoryFilterBtn} ${(isOpen || activeCount > 0) ? styles.categoryFilterBtnActive : ''}`}
                onClick={() => setIsOpen(p => !p)}
                aria-label="Filter societies"
            >
                <Filter size={14} />
                <span>Filter</span>
                {activeCount > 0 && <span className={styles.categoryFilterBadge}>{activeCount}</span>}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.categoryFilterPopup}
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                        <span className={styles.categoryFilterTitle}>Status</span>
                        <div className={styles.ratificationOptions}>
                            {RATIFICATION_OPTS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`${styles.ratificationPill} ${filters.ratified === opt.value ? styles.ratificationPillActive : ''}`}
                                    onClick={() => toggleRatified(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <span className={styles.categoryFilterTitle}>Category</span>
                        <TagsSelector
                            tags={CATEGORY_TAGS}
                            selectedTags={selectedTagObjects}
                            onSelectionChange={handleCategoryChange}
                            emptyHint="Select categories to filter…"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const SORT_OPTIONS = [
    { value: "name", label: "A → Z" },
    { value: "name-desc", label: "Z → A" },
    { value: "newest", label: "Newest" },
    { value: "members", label: "Most Members" },
];

function SortDropdown({ value, onChange }) {
    return (
        <AnimatedDropdown className={styles.sortDropdown} value={value} onChange={onChange} options={SORT_OPTIONS} placeholder="Sort by" />
    );
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

function filterAndSort(list, search, filters, sortBy) {
    const filtered = list.filter(s => matchesAllFilters(s, search, filters));
    return sortSocieties(filtered, sortBy);
}

function matchesAllFilters(society, search, filters) {
    const matchesSearch = society.name.toLowerCase().includes(search.toLowerCase());
    const matchesRatified = matchesRatification(society, filters.ratified);
    const categoryMatch = filters.categories.length === 0
        ? true
        : filters.categories.some(cat => matchesCategory(society, cat));
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
