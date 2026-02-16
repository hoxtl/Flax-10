import { useState } from "react";
import styles from "./SocietyDetailPage.module.css";
import { useSocietyDetail } from "../../components/Society/hooks/useSocietyDetail";
import SocietyHero from "../../components/Society/SocietyDetail/SocietyHero";
import SocietyInfo from "../../components/Society/SocietyDetail/SocietyInfo";
import SocietyTabs from "../../components/Society/SocietyDetail/tabs/SocietyTabs";
import SocietySidebar from "../../components/Society/SocietyDetail/SocietySidebar";
import CoverImageModal from "../../components/Society/SocietyDetail/imageHandlers/CoverImageModal";
import ImageGalleryModal from "../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal";

export default function SocietyDetailPage({ societyId, onBack }) {
    const hookData = useSocietyDetail(societyId);
    const { society, loading, error, updateSociety } = hookData;
    const [activeTab, setActiveTab] = useState("calendar");
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showCoverModal, setShowCoverModal] = useState(false);

    if (loading) return <div className={styles.page}>Loading...</div>;
    if (error || !society) return <NotFound onBack={onBack} />;

    const canEdit = society.is_admin;
    const availablePhotos = getAvailablePhotos(society);
    const handlers = buildHandlers(hookData);
    const updateImages = (imgs) => updateSociety({ images: imgs, image: imgs[0] || null });

    return (
        <div className={styles.page}>
            <TopBar onBack={onBack} canEdit={canEdit} editMode={editMode} setEditMode={setEditMode} />
            <SocietyHero society={society} onImageClick={() => setGalleryOpen(true)}
                editMode={editMode} onUpdateName={(name) => updateSociety({ name })}
                onEditImages={() => setShowCoverModal(true)} />
            <SocietyInfo society={society} editMode={editMode} onUpdateSociety={updateSociety} />
            <MainContent activeTab={activeTab} setActiveTab={setActiveTab} society={society}
                editMode={editMode} handlers={handlers} />
            {galleryOpen && <ImageGalleryModal images={getImageUrls(society.images)} onClose={() => setGalleryOpen(false)} />}
            {showCoverModal && <CoverImageModal images={getImageUrls(society.images)} availablePhotos={availablePhotos}
                onClose={() => setShowCoverModal(false)} onUpdate={updateImages} />}
        </div>
    );
}

function buildHandlers(hookData) {
    const { updateSociety, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        addEvent, updateEvent, deleteEvent, addTag, deleteTag } = hookData;
    return {
        updateSociety, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        addEvent, updateEvent, deleteEvent, addTag, deleteTag
    };
}

function getImageUrls(images) {
    return (images || []).map(i => i.url || i);
}

function getAvailablePhotos(society) {
    const announcementImages = (society.announcements || []).flatMap(a => a.images?.map(i => i.url) || []);
    const currentCovers = new Set(getImageUrls(society.images));
    return announcementImages.filter(img => !currentCovers.has(img));
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

function MainContent({ activeTab, setActiveTab, society, editMode, handlers }) {
    const tags = society.tags || [];
    const tagHandlers = { onAddTag: handlers.addTag, onDeleteTag: handlers.deleteTag };
    const eventHandlers = { onAdd: handlers.addEvent, onUpdate: handlers.updateEvent, onDelete: handlers.deleteEvent };
    return (
        <div className={styles.mainContent}>
            <div className={styles.tabSection}>
                <SocietyTabs activeTab={activeTab} onTabChange={setActiveTab} society={society}
                    editMode={editMode} onUpdate={handlers.updateSociety} eventHandlers={eventHandlers}
                    tags={tags} tagHandlers={tagHandlers} />
            </div>
            <SocietySidebar society={society} editMode={editMode} tags={tags}
                onAddAnnouncement={handlers.addAnnouncement} onAddEvent={handlers.addEvent} />
        </div>
    );
}
