import { useState } from "react";
import styles from "./SocietyDetailPage.module.css";
import { MOCK_SOCIETY_DETAILS } from "./SocietyData";
import SocietyHero from "../components/Society/SocietyDetail/SocietyHero";
import SocietyInfo from "../components/Society/SocietyDetail/SocietyInfo";
import SocietyTabs from "../components/Society/SocietyDetail/SocietyTabs";
import SocietySidebar from "../components/Society/SocietyDetail/SocietySidebar";
import CoverImageModal from "../components/Society/SocietyDetail/CoverImageModal";
import ImageGalleryModal from "../components/Society/SocietyDetail/ImageGalleryModal";
import { useTags } from "../context/TagContext";

export default function SocietyDetailPage({ society: initialSociety, onBack }) {
    const [society, setSociety] = useState(initialSociety);
    const [details, setDetails] = useState(MOCK_SOCIETY_DETAILS[initialSociety.id] || {});
    const [activeTab, setActiveTab] = useState("calendar");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showCoverModal, setShowCoverModal] = useState(false);
    const { tags } = useTags();

    if (!society) return <NotFound onBack={onBack} />;
    const canEdit = society.isAdmin;
    const availablePhotos = useAvailablePhotos(details);

    const handlers = useDetailHandlers(setSociety, setDetails);

    return (
        <div className={styles.page}>
            <TopBar onBack={onBack} canEdit={canEdit} editMode={editMode} setEditMode={setEditMode} />
            <SocietyHero society={society} details={details} onImageClick={() => setGalleryOpen(true)}
                editMode={editMode} onUpdateName={(name) => handlers.updateSociety({ name })}
                onEditImages={() => setShowCoverModal(true)} />
            <SocietyInfo society={society} details={details} editMode={editMode} onUpdateSociety={handlers.updateDetails} />
            <MainContent activeTab={activeTab} setActiveTab={setActiveTab} details={details}
                editMode={editMode} onUpdateDetails={handlers.updateDetails} tags={tags} onAddAnnouncement={handlers.addAnnouncement} />
            {galleryOpen && <ImageGalleryModal images={details.images || []} onClose={() => setGalleryOpen(false)} />}
            {showCoverModal && <CoverImageModal images={details.images || []} availablePhotos={availablePhotos}
                onClose={() => setShowCoverModal(false)} onUpdate={(imgs) => handlers.updateDetails({ images: imgs })}
                onAdd={handlers.addCoverImage} />}
        </div>
    );
}

function useDetailHandlers(setSociety, setDetails) {
    const updateSociety = (updates) => setSociety(prev => ({ ...prev, ...updates }));
    const updateDetails = (updates) => setDetails(prev => ({ ...prev, ...updates }));
    const addCoverImage = (img) => setDetails(prev => ({ ...prev, images: [...(prev.images || []), img] }));
    const addAnnouncement = (data) => handleAddAnnouncement(data, setDetails);
    return { updateSociety, updateDetails, addCoverImage, addAnnouncement };
}

function handleAddAnnouncement(data, setDetails) {
    const announcement = { id: Date.now(), title: data.title, content: data.content, images: data.images || [],
        image: data.images?.[0] || null, tagId: data.tagId, date: new Date().toISOString().split('T')[0], pinned: data.pinned || false };
    setDetails(prev => ({ ...prev, announcements: [...(prev.announcements || []), announcement] }));
    if (data.addAsEvent) addEventFromAnnouncement(data, setDetails);
}

function addEventFromAnnouncement(data, setDetails) {
    const event = { id: Date.now() + 1, title: data.title, date: data.date, time: data.allDay ? "00:00" : data.startTime };
    setDetails(prev => ({ ...prev, upcomingEvents: [...(prev.upcomingEvents || []), event] }));
}

function useAvailablePhotos(details) {
    const generalPhotos = details.photos || [];
    const announcementPhotos = (details.announcements || []).filter(a => a.image).map(a => a.image);
    const currentCovers = new Set(details.images || []);

    return [...generalPhotos, ...announcementPhotos].filter(img => !currentCovers.has(img));
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

function MainContent({ activeTab, setActiveTab, details, editMode, onUpdateDetails, tags, onAddAnnouncement }) {
    return (
        <div className={styles.mainContent}>
            <div className={styles.tabSection}>
                <SocietyTabs activeTab={activeTab} onTabChange={setActiveTab} details={details}
                    editMode={editMode} onUpdateDetails={onUpdateDetails} tags={tags} />
            </div>
            <SocietySidebar details={details} editMode={editMode} tags={tags}
                onAddAnnouncement={onAddAnnouncement} onAddEvent={() => console.log("Open event modal")} />
        </div>
    );
}
