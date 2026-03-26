/*
 * AllSocieties renders the browse view for exploring the full societies directory.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter } from "lucide-react";
import styles from "./SocietiesPage.module.css";
<<<<<<< HEAD
import { ToolbarSortControl } from "../../components/common/page_toolbar/PageToolbar";
import SearchBar from "../../components/common/search_bar";
import AnimatedDropdown from "../../components/common/animated_dropdown";
import { TagsSelector } from "../../components/common/tags_selector/TagsSelector";
import { BackToTop } from "../../components/pagination/Pagination";
import BackButton from "../../components/common/back_button/BackButton.jsx";
=======
import { ToolbarSortControl } from "../../components/common/PageToolbar/PageToolbar";
import SearchBar from "../../components/common/SearchBar";
import AnimatedDropdown from "../../components/common/AnimatedDropdown";
import { TagsSelector } from "../../components/common/TagsSelector/TagsSelector";
import { BackToTop } from "../../components/Pagination/Pagination";
import BackButton from "../../components/common/BackButton/BackButton.jsx";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { SocietyBrowseResults } from "./SocietyBrowseResults";
import { RATIFICATION_FILTERS, SOCIETY_CATEGORIES } from "./societyFilters";
import { useSocietyBrowseFilters } from "./useSocietyBrowseFilters";
import { countForFilter, filterAndSort } from "./societyBrowseUtils";

const SORT_OPTIONS = [
    { value: "name", label: "A → Z" },
    { value: "name-desc", label: "Z → A" },
    { value: "newest", label: "Newest" },
    { value: "members", label: "Most Members" },
];

export default function AllSocieties({ onBack, onSelect, societies = [], onReport, onUnreport }) {
    const filterState = useSocietyBrowseFilters();
    const filtered = useMemo(() => filterAndSort(societies, filterState.search, filterState.filters, filterState.sortBy), [societies, filterState.search, filterState.filters, filterState.sortBy]);
    return (
        <div className={styles.container}>
            <BrowseHeader onBack={onBack} filterState={filterState} societies={societies} />
            <SocietyBrowseResults items={filtered} search={filterState.search} setSearch={filterState.setSearch} onSelect={onSelect} onReport={onReport} onUnreport={onUnreport} />
            <BackToTop />
        </div>
    );
}

<<<<<<< HEAD
function BrowseControls({ filterState, societies, activeCount }) {
    return (
        <div className={styles.browseControls}>
            {activeCount > 0 && (
                <button type="button" className={styles.clearFiltersBtn} onClick={filterState.clearFilters}>
                    Clear
                </button>
            )}
            <SocietyFilterButton filterState={filterState} societies={societies} />
            <ToolbarSortControl className={styles.browseSortControl}><SortDropdown value={filterState.sortBy} onChange={filterState.setSortBy} /></ToolbarSortControl>
        </div>
    );
}

function BrowseToolbar({ filterState, societies }) {
    const activeCount = getActiveFilterCount(filterState.filters);
    return (
        <div className={styles.browseToolbar}>
            <div className={styles.browseSearch}><SearchBar value={filterState.search} onChange={filterState.setSearch} placeholder="Search societies..." /></div>
            <BrowseControls filterState={filterState} societies={societies} activeCount={activeCount} />
        </div>
    );
}

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function BrowseHeader({ onBack, filterState, societies }) {
    return (
        <>
            <header className={styles.header}><BackButton onClick={onBack} label="Back" /></header>
<<<<<<< HEAD
            <BrowseToolbar filterState={filterState} societies={societies} />
=======
            <div className={styles.browseToolbar}>
                <div className={styles.browseSearch}><SearchBar value={filterState.search} onChange={filterState.setSearch} placeholder="Search societies..." /></div>
                <div className={styles.browseControls}>
                    <SocietyFilterButton filterState={filterState} societies={societies} />
                    <ToolbarSortControl className={styles.browseSortControl}><SortDropdown value={filterState.sortBy} onChange={filterState.setSortBy} /></ToolbarSortControl>
                </div>
            </div>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        </>
    );
}

<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/Societies/AllSocieties.jsx
<<<<<<< HEAD
function RatificationPills({ filterState, societies }) {
    return (
        <div className={styles.ratificationOptions}>
            {RATIFICATION_FILTERS.map((filter) => (
                <RatificationPill
                    key={filter.id}
                    filter={filter}
                    currentValue={filterState.filters.ratified}
                    count={countForFilter(societies, filter.id)}
                    onSelect={() => filterState.toggleFilter("ratified", filter.id)}
                />
            ))}
        </div>
    );
}
=======
>>>>>>> main:flax-10-project-files/frontend/src/pages/societies/AllSocieties.jsx

function SortDropdown({ value, onChange }) {
    return <AnimatedDropdown className={styles.sortDropdown} value={value} onChange={onChange} options={SORT_OPTIONS} placeholder="Sort by" align="right" />;
=======
function SortDropdown({ value, onChange }) {
    return <AnimatedDropdown className={styles.sortDropdown} value={value} onChange={onChange} options={SORT_OPTIONS} placeholder="Sort by" />;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

function SocietyFilterButton({ filterState, societies }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapRef = useRef(null);
    useCloseOnOutsideClick(wrapRef, isOpen, () => setIsOpen(false));
    const hoverHandlers = useHoverClose(isOpen, setIsOpen);
    const activeCount = getActiveFilterCount(filterState.filters);
    return (
        <div className={styles.categoryFilterWrap} ref={wrapRef} {...hoverHandlers}>
            <FilterToggleButton isOpen={isOpen} activeCount={activeCount} onClick={() => setIsOpen((value) => !value)} />
            <AnimatePresence>{isOpen && <FilterPopup filterState={filterState} societies={societies} />}</AnimatePresence>
        </div>
    );
}

function useCloseOnOutsideClick(wrapRef, isOpen, onClose) {
    useEffect(() => {
        if (!isOpen) return;
        const handler = (event) => wrapRef.current && !wrapRef.current.contains(event.target) && onClose();
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen, onClose, wrapRef]);
}

function useHoverClose(isOpen, setIsOpen) {
    const hoverTimer = useRef(null);
    useEffect(() => () => clearTimeout(hoverTimer.current), []);
    return {
        onMouseEnter: () => {
            clearTimeout(hoverTimer.current);
<<<<<<< HEAD
            setIsOpen(true);
=======
            if (!isOpen) setIsOpen(true);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        },
        onMouseLeave: () => {
            hoverTimer.current = setTimeout(() => setIsOpen(false), 200);
        },
    };
}

function getActiveFilterCount(filters) {
    let count = 0;
    if (filters.ratified !== "all") count += 1;
    if (filters.category.length > 0) count += 1;
    return count;
}

function FilterToggleButton({ isOpen, activeCount, onClick }) {
    const activeClass = isOpen || activeCount > 0 ? styles.categoryFilterBtnActive : "";
    return (
        <button type="button" className={`${styles.categoryFilterBtn} ${activeClass}`} onClick={onClick} aria-label="Filter societies">
            <Filter size={14} />
            <span>Filter</span>
            {activeCount > 0 && <span className={styles.categoryFilterBadge}>{activeCount}</span>}
        </button>
    );
}

function FilterPopup({ filterState, societies }) {
    return (
        <motion.div className={styles.categoryFilterPopup} initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15, ease: "easeOut" }}>
            <FilterSectionTitle title="Status" />
            <RatificationOptions filterState={filterState} societies={societies} />
            <FilterSectionTitle title="Category" />
            <CategoryOptions filterState={filterState} />
        </motion.div>
    );
}

function FilterSectionTitle({ title }) {
    return <span className={styles.categoryFilterTitle}>{title}</span>;
}

function RatificationOptions({ filterState, societies }) {
    return (
        <div className={styles.ratificationOptions}>
            {RATIFICATION_FILTERS.map((filter) => <RatificationPill key={filter.id} filter={filter} currentValue={filterState.filters.ratified} count={countForFilter(societies, filter.id)} onSelect={() => filterState.toggleFilter("ratified", filter.id)} />)}
        </div>
    );
}

function RatificationPill({ filter, currentValue, count, onSelect }) {
    const activeClass = currentValue === filter.id ? styles.ratificationPillActive : "";
    return <button type="button" className={`${styles.ratificationPill} ${activeClass}`} onClick={onSelect}>{filter.label} ({count})</button>;
}

function CategoryOptions({ filterState }) {
    return (
        <TagsSelector
            tags={SOCIETY_CATEGORIES}
            selectedTags={filterState.filters.category}
            onSelectionChange={filterState.setCategory}
            emptyHint="All categories"
        />
    );
}
