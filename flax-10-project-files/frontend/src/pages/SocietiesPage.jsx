import { useState } from "react";
import styles from "./SocietiesPage.module.css";
import { MOCK_SOCIETIES, MOCK_SOCIETY_DETAILS } from "./SocietyData";
import AllSocieties from "./AllSocieties";
import SocietySection from "./SocietySection";
import SocietyDetailPage from "./SocietyDetailPage";
import CreateSocietyModal from "../components/Society/CreateSocietyModal";

export default function SocietiesPage() {
    const state = useSocietiesPage();

    if (state.selectedSociety) return <SocietyDetailPage society={state.selectedSociety} onBack={() => state.setSelectedSociety(null)} />;
    if (state.view === "all") return <AllSocieties onBack={() => state.setView("my")} onSelect={state.setSelectedSociety} />;

    return (
        <>
            <MySocietiesView setView={state.setView} onSelect={state.setSelectedSociety}
                onCreateClick={() => state.setShowCreateModal(true)} societies={state.societies} />
            {state.showCreateModal && <CreateSocietyModal onClose={() => state.setShowCreateModal(false)} onCreate={state.handleCreate} />}
        </>
    );
}

function useSocietiesPage() {
    const [view, setView] = useState("my");
    const [selectedSociety, setSelectedSociety] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [societies, setSocieties] = useState(MOCK_SOCIETIES);

    function handleCreate(form) {
        const newId = generateNewId(societies);
        const newSociety = createMockSociety(newId, form);
        MOCK_SOCIETY_DETAILS[newId] = createMockDetails(form);
        setSocieties([...societies, newSociety]);
        setShowCreateModal(false);
        setTimeout(() => setSelectedSociety(newSociety), 0);
    }

    return { view, setView, selectedSociety, setSelectedSociety, showCreateModal, setShowCreateModal, societies, handleCreate };
}

function generateNewId(societies) {
    return societies.length > 0 ? Math.max(...societies.map(s => s.id)) + 1 : 1;
}

function createMockSociety(id, form) {
    return {
        id,
        name: form.name,
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97",
        isRatified: form.isRatified,
        memberCount: 1,
        isAdmin: true,
        isPrivate: form.isPrivate
    };
}

function createMockDetails(form) {
    return {
        bio: form.bio,
        about: form.bio,
        dateCreated: new Date().toISOString().split('T')[0],
        images: [],
        photos: [],
        announcements: [],
        upcomingEvents: [],
        isMember: true
    };
}

function MySocietiesView({ setView, onSelect, onCreateClick, societies }) {
    const adminOf = societies.filter(s => s.isAdmin);
    const memberOf = societies.filter(s => !s.isAdmin);

    return (
        <div className={styles.container}>
            <SocietySection title="Managed Societies" items={adminOf}
                type="admin" onAction={onCreateClick} onSelect={onSelect} />

            <SocietySection title="My Memberships" items={memberOf}
                type="member" onAction={() => setView("all")} allSocieties={societies} onSelect={onSelect} />
        </div>
    );
}