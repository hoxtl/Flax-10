import { useState, useMemo } from "react";
import { MOCK_SOCIETIES } from "./SocietyData";
import SocietyCard from "../components/Society/SocietyCard";
import PillFilters from "../components/PillFilters";
import styles from "./SocietiesPage.module.css";
import BasePill from "../components/BasePill";
import { countByType } from "../utils/pillUtils";

export default function AllSocieties({ onBack }) {
    const [search, setSearch] = useState("");
    const [activeFilters, setActiveFilters] = useState(["all"]);

    const filterOptions = [
        { id: "all", label: "All" },
        { id: "ratified", label: "Ratified ✅" },
        { id: "unratified", label: "Unratified" }
    ];
    const counts = countByType(MOCK_SOCIETIES);
    const filtered = useMemo(() => MOCK_SOCIETIES.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        if (activeFilters.includes("all")) return matchesSearch;

        const matchesRatified = activeFilters.includes("ratified") ? s.isRatified : false;
        const matchesUnratified = activeFilters.includes("unratified") ? !s.isRatified : false;

        return matchesSearch && (matchesRatified || matchesUnratified);
    }), [search, activeFilters]);

    function handleToggle(id) {
        if (id === "all") return setActiveFilters(["all"]);

        setActiveFilters(prev => {
            const withoutAll = prev.filter(item => item !== "all");
            const exists = withoutAll.includes(id);
            const next = exists ? withoutAll.filter(i => i !== id) : [...withoutAll, id];

            return next.length === 0 ? ["all"] : next;
        });
    }
    return (
        <div className={styles.container}>
            <h2>All Societies</h2>
            <header className={styles.header}>
                <button onClick={onBack} className={styles.backBtn}>← Back</button>
                <input className={styles.searchBar} placeholder="Search all societies..." onChange={e => setSearch(e.target.value)} />
            </header>
            <div className={styles.pillContainer}>
                {filterOptions.map(opt => (
                    <BasePill
                        key={opt.id}
                        label={opt.label}
                        count={counts[opt.id] || 0}
                        isActive={activeFilters.includes(opt.id)}
                        onClick={() => handleToggle(opt.id)}
                    />
                ))}
            </div>
            <div className={styles.grid}>
                {filtered.map(s => (
                    <SocietyCard key={s.id} society={s} />
                ))}
            </div>
        </div>
    );
}

function emptyState() {
    return (
        <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>No societies found.</p>
        </div>
    );
}