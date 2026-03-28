/*
 * SocietyBrowseResults renders paginated browse results and empty states.
 */

import SocietyCard from "../../../components/society/components/SocietyCard";
import gridStyles from "../../../components/common/card/CardGrid.module.css";
import EmptyState from "../../../components/common/empty_state/EmptyState";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import { Pagination } from "../../../components/pagination/Pagination";
import { usePagination } from "../../../hooks/usePagination";

const PAGE_SIZE = 15;

/** Renders society browse cards with pagination and empty states. */
export function SocietyBrowseResults({ items, search, setSearch, onClear, onSelect, onReport, onUnreport }) {
    if (!items.length) return <BrowseEmptyState search={search} onClear={onClear || (() => setSearch(""))} />;
    return <PaginatedResults items={items} onSelect={onSelect} onReport={onReport} onUnreport={onUnreport} />;
}

function BrowseEmptyState({ search, onClear }) {
    const trimmedSearch = search.trim();
    return trimmedSearch ? <SearchBrowseEmptyState search={trimmedSearch} onClear={onClear} /> : <DefaultBrowseEmptyState />;
}

function DefaultBrowseEmptyState() {
    return <EmptyState title="No societies found" description="Try adjusting your search or filters." />;
}

function SearchBrowseEmptyState({ search, onClear }) {
    return <SearchEmptyState query={search} itemLabel="societies" hint="Try adjusting your search or filters" alwaysShowClear clearLabel="Clear all" onClear={onClear} />;
}

function PaginatedResults({ items, onSelect, onReport, onUnreport }) {
    const { currentItems, totalPages, currentPage, setPage } = usePagination(items, PAGE_SIZE);
    return (
        <>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
            <ResultsGrid items={currentItems} onSelect={onSelect} onReport={onReport} onUnreport={onUnreport} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
    );
}

function ResultsGrid({ items, onSelect, onReport, onUnreport }) {
    return <div className={gridStyles.grid}>{items.map((society) => <SocietyCard key={society.id} society={society} onClick={onSelect} onReport={onReport} onUnreport={onUnreport} />)}</div>;
}
