import { useState } from "react";
import SocietyCard from "../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import { MOCK_SOCIETIES } from "./SocietyData";

export default function SocietiesPage() {
    const [search, setSearch] = useState("");
    const [mySocieties] = useState(MOCK_SOCIETIES);
    const filtered = mySocieties.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className={styles.container}>
            <h2>My Societies</h2>
            {mySocieties.length > 0 ? (
                <>
                    <div className={styles.header}>
                        <input className={styles.searchBar} placeholder="Search my societies..." value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button className={styles.browseBtn}>Browse All</button>
                    </div>
                    <div className={styles.grid}>
                        {filtered.map(soc => <SocietyCard key={soc.id} society={soc} />)}
                    </div>
                </>
            ) : (
                <EmptySocieties onBrowse={() => console.log("Navigate to Browse")} />
            )}
        </div>
    )
}

function EmptySocieties({ onBrowse }) {
    return (
        <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>You haven't joined any societies yet. 😊</p>
            <button className={styles.emptyBrowseBtn} onClick={onBrowse}>Browse All Societies</button>
        </div>
    )
}