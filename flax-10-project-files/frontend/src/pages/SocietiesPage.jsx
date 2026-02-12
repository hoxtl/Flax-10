import { useState } from "react";
import SocietyCard from "../components/Society/SocietyCard";
import styles from "./SocietiesPage.module.css";
import { MOCK_SOCIETIES } from "./SocietyData";
import AllSocieties from "./AllSocieties";

export default function SocietiesPage() {
    const [view, setView] = useState("my");
    const [mySocieties] = useState([]);

    if (view === "all") {
        return <AllSocieties onBack={() => setView("my")} />
    }

    return (
        <div className={styles.container}>
            <h2>My Societies</h2>
            {mySocieties.length > 0 ? (
                <SocietyGrid societies={mySocieties} onBrowse={() => setView("all")} />
            ) : (
                <EmptyState onBrowse={() => setView("all")} />
            )}
        </div>
    )
}

function EmptyState({ onBrowse }) {
    return (
        <div className={styles.emptyContainer}>
            <p className={styles.emptyText}>You haven't joined any societies yet. 😊</p>
            <button className={styles.emptyBrowseBtn} onClick={onBrowse}>Browse All Societies</button>
        </div>
    )
}