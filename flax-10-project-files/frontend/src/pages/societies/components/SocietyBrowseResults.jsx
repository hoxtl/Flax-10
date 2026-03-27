/*
 * SocietyBrowseResults renders paginated browse results and empty states.
 */

<<<<<<< HEAD:flax-10-project-files/frontend/src/pages/societies/components/SocietyBrowseResults.jsx
import SocietyCard from "../../../components/society/components/SocietyCard";
import gridStyles from "../../../components/common/Card/CardGrid.module.css";
import EmptyState from "../../../components/common/empty_state/EmptyState";
import SearchEmptyState from "../../../components/common/search_empty_state/SearchEmptyState";
import { Pagination } from "../../../components/pagination/Pagination";
import { usePagination } from "../../../hooks/usePagination";
=======
import SocietyCard from "../../components/society/SocietyCard";
import gridStyles from "../../components/common/card/CardGrid.module.css";
import EmptyState from "../../components/common/empty_state/EmptyState";
import SearchEmptyState from "../../components/common/search_empty_state/SearchEmptyState";
import { Pagination } from "../../components/pagination/Pagination";
import { usePagination } from "../../hooks/usePagination";
>>>>>>> main:flax-10-project-files/frontend/src/pages/societies/SocietyBrowseResults.jsx

const PAGE_SIZE = 15;

export function SocietyBrowseResults({ items, search, setSearch, onSelect, onReport, onUnreport }) {
    if (!items.length) return <BrowseEmptyState search={search} setSearch={setSearch} />;
    return (
        <PaginatedResults
            items={items}
            onSelect={onSelect}
            onReport={onReport}
            onUnreport={onUnreport}
        />
    );
}

function BrowseEmptyState({ search, setSearch }) {
    if (String(search || "").trim()) return <BrowseSearchEmpty search={search} setSearch={setSearch} />;
    return <EmptyState icon="🎭" title="No societies found" description="Try adjusting your search or filters." />;
}

function BrowseSearchEmpty({ search, setSearch }) {
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
    return (
        <div className={gridStyles.grid}>
            {items.map((society) => (
                <SocietyCard
                    key={society.id}
                    society={society}
                    onClick={onSelect}
                    onReport={onReport}
                    onUnreport={onUnreport}
                />
            ))}
        </div>
    );
}
