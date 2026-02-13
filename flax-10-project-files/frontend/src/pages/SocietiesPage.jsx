import { useState } from "react";
import styles from "./SocietiesPage.module.css";
import { MOCK_SOCIETIES } from "./SocietyData";
import AllSocieties from "./AllSocieties";
import SocietySection from "./SocietySection";

export default function SocietiesPage() {
    const [view, setView] = useState("my");

    if (view === "all") return <AllSocieties onBack={() => setView("my")} />;

    const adminOf = MOCK_SOCIETIES.filter(s => s.isAdmin);
    const memberOf = MOCK_SOCIETIES.filter(s => !s.isAdmin);

    return (
        <div className={styles.container}>
            <SocietySection title="Managed Societies" items={adminOf}
                type="admin" onAction={() => console.log("Open Create Form")} />

            <SocietySection title="My Memberships" items={memberOf}
                type="member" onAction={() => setView("all")} allSocieties={MOCK_SOCIETIES} />
        </div>
    );
}