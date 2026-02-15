import { useState } from "react";
import styles from "./SocietiesPage.module.css";
import { MOCK_SOCIETIES } from "./SocietyData";
import AllSocieties from "./AllSocieties";
import SocietySection from "./SocietySection";
import SocietyDetailPage from "./SocietyDetailPage";
import CreateSocietyModal from "../components/Society/CreateSocietyModal";

export default function SocietiesPage() {
    const [view, setView] = useState("my");
    const [selectedSociety, setSelectedSociety] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    if (selectedSociety) {
        return <SocietyDetailPage society={selectedSociety} onBack={() => setSelectedSociety(null)} />;
    }
    if (view === "all") return <AllSocieties onBack={() => setView("my")} onSelect={setSelectedSociety} />;

    return (
        <>
            <MySocietiesView setView={setView} onSelect={setSelectedSociety} onCreateClick={() => setShowCreateModal(true)} />
            {showCreateModal && <CreateSocietyModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />}
        </>
    );
}

function handleCreate(form) {
    console.log("Creating society:", form);
    // TODO: API call to create society
}

function MySocietiesView({ setView, onSelect, onCreateClick }) {
    const adminOf = MOCK_SOCIETIES.filter(s => s.isAdmin);
    const memberOf = MOCK_SOCIETIES.filter(s => !s.isAdmin);

    return (
        <div className={styles.container}>
            <SocietySection title="Managed Societies" items={adminOf}
                type="admin" onAction={onCreateClick} onSelect={onSelect} />

            <SocietySection title="My Memberships" items={memberOf}
                type="member" onAction={() => setView("all")} allSocieties={MOCK_SOCIETIES} onSelect={onSelect} />
        </div>
    );
}