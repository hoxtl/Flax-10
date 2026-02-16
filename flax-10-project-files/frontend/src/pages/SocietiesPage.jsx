import { useState } from "react";
import styles from "./SocietiesPage.module.css";
import { useSocieties } from "../hooks/useSocieties";
import AllSocieties from "./AllSocieties";
import SocietySection from "./SocietySection";
import SocietyDetailPage from "./SocietyDetailPage";
import CreateSocietyModal from "../components/Society/CreateSocietyModal";

export default function SocietiesPage() {
    const state = useSocietiesPage();

    if (state.loading) return <div className={styles.container}>Loading...</div>;
    if (state.selectedSocietyId) return <SocietyDetailPage societyId={state.selectedSocietyId} onBack={state.clearSelection} />;
    if (state.view === "all") return <AllSocieties onBack={() => state.setView("my")} onSelect={state.selectSociety} societies={state.societies} />;

    return (
        <>
            <MySocietiesView setView={state.setView} onSelect={state.selectSociety}
                onCreateClick={() => state.setShowCreateModal(true)} societies={state.societies} />
            {state.showCreateModal && <CreateSocietyModal onClose={() => state.setShowCreateModal(false)} onCreate={state.onCreate} />}
        </>
    );
}

function useSocietiesPage() {
    const [view, setView] = useState("my");
    const [selectedSocietyId, setSelectedSocietyId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { societies, loading, handleCreate, refresh } = useSocieties();

    const onCreate = async (form) => {
        const newSociety = await handleCreate(form);
        setShowCreateModal(false);
        setSelectedSocietyId(newSociety.id);
    };

    const selectSociety = (society) => setSelectedSocietyId(society.id);
    const clearSelection = () => { setSelectedSocietyId(null); refresh(); };

    return { view, setView, selectedSocietyId, selectSociety, clearSelection, showCreateModal, setShowCreateModal, societies, loading, onCreate };
}

function MySocietiesView({ setView, onSelect, onCreateClick, societies }) {
    const adminOf = societies.filter(s => s.is_admin);
    const memberOf = societies.filter(s => !s.is_admin);

    return (
        <div className={styles.container}>
            <SocietySection title="Managed Societies" items={adminOf}
                type="admin" onAction={onCreateClick} onSelect={onSelect} />

            <SocietySection title="My Memberships" items={memberOf}
                type="member" onAction={() => setView("all")} allSocieties={societies} onSelect={onSelect} />
        </div>
    );
}