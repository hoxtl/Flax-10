/*
 * AllSocieties renders the browse view for exploring the full societies directory.
 */
import { useMemo } from "react";
import styles from "./SocietiesPage.module.css";
import { ToolbarSortControl } from "../../components/common/PageToolbar/PageToolbar";
import BasePill from "../../components/Tags/BasePill";
import SearchBar from "../../components/common/SearchBar";
import AnimatedDropdown from "../../components/common/AnimatedDropdown";
import { BackToTop } from "../../components/Pagination/Pagination";
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
            <Header onBack={onBack} search={search} setSearch={setSearch} sortBy={sortBy} setSortBy={setSortBy} />
            <FilterPills {...filterState} societies={societies} />
            <SocietyBrowseResults items={filtered} search={search} setSearch={setSearch} onSelect={onSelect} onReport={onReport} onUnreport={onUnreport} />
            <BackToTop />
        </div>
    );
}

/** Header section for the all-societies view. */
function Header({ onBack, search, setSearch, sortBy, setSortBy }) {
    return (
        <>
            <header className={styles.header}>
                <BackButton onClick={onBack} label="Back" />
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
