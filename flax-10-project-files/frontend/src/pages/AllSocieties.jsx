import { useState, useMemo } from "react";
import { MOCK_SOCIETIES } from "./SocietyData";
import SocietyCard from "../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import BasePill from "../components/BasePill";
import { countByType } from "../utils/pillUtils";

const filterOptions = [
    { id: "all", label: "All" },
    { id: "ratified", label: "Ratified ✅" },
    { id: "unratified", label: "Unratified" }
];

export default function AllSocieties({ onBack, onSelect }) {
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState(["all"]);
    const counts = countByType(MOCK_SOCIETIES);
    const filtered = useMemo(() => filterSocieties(MOCK_SOCIETIES, search, activeFilters), [search, activeFilters]);
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <button onClick={onBack} className={styles.backBtn}>← Back</button>
                <input className={styles.searchBar} placeholder="Search..." onChange={e => setSearch(e.target.value)} />
            </header>
            <div className={styles.pillContainer}>
                {filterOptions.map(opt => (
                    <BasePill key={opt.id} label={opt.label} count={counts[opt.id] || 0}
                        isActive={activeFilters.includes(opt.id)} onClick={() => setActiveFilters(prev => getNextFilters(prev, opt.id))} />
                ))}
                {activeFilters[0] !== "all" && <button className={styles.clearPill} onClick={() => setActiveFilters(["all"])}>Clear All x</button>}
            </div>
            {filtered.length > 0 ? (
                <div className={styles.grid}>
                    {filtered.map(s => <SocietyCard key={s.id} society={s} onClick={() => onSelect?.(s)} />)}
                </div>
            ) : emptyState()}
        </div>
    );
}

const filterSocieties = (list, search, filters) => list.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    if (filters.includes("all")) return matchesSearch;
    const matchesPill = (filters.includes("ratified") && s.isRatified) ||
        (filters.includes("unratified") && !s.isRatified);
    return matchesSearch && matchesPill;
});

const getNextFilters = (prev, id) => {
    if (id === "all") return ["all"];
    const withoutAll = prev.filter(item => item !== "all");
    const next = withoutAll.includes(id)
        ? withoutAll.filter(i => i !== id)
        : [...withoutAll, id];
    return next.length === 0 ? ["all"] : next;
};

function emptyState() {
    return (
        <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No societies found.</p>
        </div>
    );
}