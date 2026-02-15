import { useState } from "react";
import styles from "./SocietyDetailPage.module.css";
import { MOCK_SOCIETY_DETAILS } from "./SocietyData";
import SocietyHero from "../components/Society/SocietyDetail/SocietyHero";
import SocietyInfo from "../components/Society/SocietyDetail/SocietyInfo";
import SocietyTabs from "../components/Society/SocietyDetail/SocietyTabs";
import SocietySidebar from "../components/Society/SocietyDetail/SocietySidebar";
import ImageGalleryModal from "../components/Society/SocietyDetail/ImageGalleryModal";

export default function SocietyDetailPage({ society, onBack }) {
    const [activeTab, setActiveTab] = useState("calendar");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    if (!society) return <NotFound onBack={onBack} />;

    const details = MOCK_SOCIETY_DETAILS[society.id] || {};
    const canEdit = society.isAdmin;

    return (
        <div className={styles.page}>
            <TopBar onBack={onBack} canEdit={canEdit} editMode={editMode} setEditMode={setEditMode} />
            <SocietyHero society={society} details={details} onImageClick={() => setGalleryOpen(true)} editMode={editMode} />
            <SocietyInfo society={society} details={details} editMode={editMode} />
            <MainContent activeTab={activeTab} setActiveTab={setActiveTab} details={details} editMode={editMode} />
            {galleryOpen && <ImageGalleryModal images={details.images || []} onClose={() => setGalleryOpen(false)} />}
        </div>
    );
}

function TopBar({ onBack, canEdit, editMode, setEditMode }) {
    return (
        <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={onBack}>&larr; Back to Societies</button>
            {canEdit && <EditToggle editMode={editMode} setEditMode={setEditMode} />}
        </div>
    );
}

function EditToggle({ editMode, setEditMode }) {
    return (
        <button className={`${styles.editToggle} ${editMode ? styles.editActive : ""}`} onClick={() => setEditMode(!editMode)}>
            {editMode ? "Exit Editor" : "Edit Society"}
        </button>
    );
}

function NotFound({ onBack }) {
    return (
        <div className={styles.notFound}>
            <p>Society not found.</p>
            <button onClick={onBack}>Back to Societies</button>
        </div>
    );
}

function MainContent({ activeTab, setActiveTab, details, editMode }) {
    return (
        <div className={styles.mainContent}>
            <div className={styles.tabSection}>
                <SocietyTabs activeTab={activeTab} onTabChange={setActiveTab} details={details} editMode={editMode} />
            </div>
            <SocietySidebar details={details} editMode={editMode} />
        </div>
    );
}
