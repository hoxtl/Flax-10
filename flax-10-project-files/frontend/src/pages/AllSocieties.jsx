import { useState } from "react";
import { MOCK_SOCIETIES } from "./SocietyData";
import SocietyCard from "../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";

export default function AllSocieties({ onBack }) {
    const [search, setSearch] = useState("");
    const [onlyRatified, setOnlyRatified] = useState(false);
    const filtered = MOCK_SOCIETIES.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
        const matchesRatified = !onlyRatified || s.isRatified;
        return matchesSearch && matchesRatified;
    });
    return (
        <div className={styles.container}>
            <h2>All Societies</h2>
            <header className={styles.header}>
                <button onClick={onBack} className={styles.backBtn}>← Back</button>
                <input className={styles.searchBar} placeholder="Search all societies..." onChange={e => setSearch(e.target.value)} />
            </header>
            <div className={styles.filterBar}>
                <label>
                    <input type="checkbox" onChange={e => setOnlyRatified(e.target.checked)} />
                    Show only Ratified (Official Societies)
                </label>
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