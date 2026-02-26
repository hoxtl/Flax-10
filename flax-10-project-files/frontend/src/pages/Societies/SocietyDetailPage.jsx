import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./SocietyDetailPage.module.css";
import { useSocietyDetail } from "../../components/Society/hooks/useSocietyDetail";
import SocietyHero from "../../components/Society/SocietyDetail/SocietyHero";
import SocietyInfo from "../../components/Society/SocietyDetail/SocietyInfo";
import SocietyTabs from "../../components/Society/SocietyDetail/tabs/SocietyTabs";
import SocietySidebar from "../../components/Society/SocietyDetail/SocietySidebar";
import CoverImageModal from "../../components/Society/SocietyDetail/imageHandlers/CoverImageModal";
import ImageGalleryModal from "../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal";
import SettingsModal from "../../components/Society/SocietyDetail/SettingsModal";
import AnnouncementModal from "../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal";

export default function SocietyDetailPage({ societyId, onBack }) {
    const hookData = useSocietyDetail(societyId);
    const { society, loading, error, updateSociety, members } = hookData;
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || "calendar");
    const [focusAnnouncementId, setFocusAnnouncementId] = useState(location.state?.announcementId || null);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showCoverModal, setShowCoverModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        if (location.state?.activeTab) {
            window.history.replaceState({}, document.title);
        }
    }, []);

    const handleTabChange = (tab, announcementId = null) => {
        setActiveTab(tab);
        setFocusAnnouncementId(announcementId);
    };

    const handleAnnouncementSave = (data, conflictingAnnouncement) => {
        const { updateAnnouncement, addAnnouncement } = buildHandlers(hookData);
    };

    if (loading) return <div className={styles.page}>Loading...</div>;
    if (error || !society) return <NotFound onBack={onBack} />;

    const canEdit = society.is_admin;
    const availablePhotos = getAvailablePhotos(society);
    const handlers = buildHandlers(hookData);
    const updateImages = (imgs) => updateSociety({ images: imgs, image: imgs[0] || null });
    const handleDelete = async () => { await handlers.deleteSociety(); onBack(); };

    return (
        <div className={styles.page}>
            <TopBar onBack={onBack} isAdmin={society.role === 'admin'}
                onSettings={() => setShowSettings(true)} />
            <SocietyHero society={society} onImageClick={() => setGalleryOpen(true)}
                editMode={editMode} onUpdateName={(name) => updateSociety({ name })}
                onEditImages={() => setShowCoverModal(true)} />
            <SocietyInfo society={society} editMode={editMode} onUpdateSociety={updateSociety}
                onJoin={handlers.joinSociety} onLeave={handlers.leaveSociety}
                canEdit={canEdit} onToggleEditMode={() => setEditMode(!editMode)} />
            <MainContent activeTab={activeTab} setActiveTab={handleTabChange} society={society}
                editMode={editMode} handlers={handlers} focusAnnouncementId={focusAnnouncementId}
                onEditAnnouncement={setEditingAnnouncement} />
            {galleryOpen && <ImageGalleryModal images={getImageUrls(society.images)} onClose={() => setGalleryOpen(false)} />}
            {showCoverModal && <CoverImageModal images={getImageUrls(society.images)} availablePhotos={availablePhotos}
                onClose={() => setShowCoverModal(false)} onUpdate={updateImages} />}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onDelete={handleDelete}
                members={members} onFetchMembers={handlers.fetchMembers} onUpdateRole={handlers.updateMemberRole}
                onRemoveMember={handlers.removeMember} onAddCollaborator={handlers.addCollaborator}
                ratificationStatus={society.ratification_status} isRatified={society.is_ratified}
                onRequestRatification={handlers.requestRatification} />}
            {editingAnnouncement && <AnnouncementModal announcement={editingAnnouncement} tags={society.tags}
                onClose={() => setEditingAnnouncement(null)}
                onDelete={(id) => { handlers.deleteAnnouncement(id); setEditingAnnouncement(null); }}
                onSubmit={(data, conflict) => {
                    if (conflict) handlers.updateAnnouncement(conflict.id, { ...conflict, pinned: false });
                    if (data.id) handlers.updateAnnouncement(data.id, data);
                    else handlers.addAnnouncement(data);
                    setEditingAnnouncement(null);
                }}
                societyId={societyId} announcements={society.announcements} />}
        </div>
    );
}

function buildHandlers(hookData) {
    const { updateSociety, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        addEvent, updateEvent, deleteEvent, addException, addTag, deleteTag, joinSociety, leaveSociety,
        deleteSociety, fetchMembers, updateMemberRole, removeMember, addCollaborator,
        requestRatification } = hookData;
    return {
        updateSociety, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        addEvent, updateEvent, deleteEvent, addException, addTag, deleteTag, joinSociety, leaveSociety,
        deleteSociety, fetchMembers, updateMemberRole, removeMember, addCollaborator,
        requestRatification
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

function TopBar({ onBack, isAdmin, onSettings }) {
    return (
        <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={onBack}>&larr; Back to Societies</button>
            {isAdmin && <button className={styles.settingsBtn} onClick={onSettings} title="Settings">⚙</button>}
        </div>
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

function MainContent({ activeTab, setActiveTab, society, editMode, handlers, focusAnnouncementId, onEditAnnouncement }) {
    const tags = society.tags || [];
    const tagHandlers = { onAddTag: handlers.addTag, onDeleteTag: handlers.deleteTag };
    const eventHandlers = { onAdd: handlers.addEvent, onUpdate: handlers.updateEvent, onDelete: handlers.deleteEvent, onAddException: handlers.addException };
    const announcementHandlers = { onAdd: handlers.addAnnouncement, onUpdate: handlers.updateAnnouncement, onDelete: handlers.deleteAnnouncement };
    return (
        <div className={styles.mainContent}>
            <div className={styles.tabSection}>
                <SocietyTabs activeTab={activeTab} onTabChange={setActiveTab} society={society}
                    editMode={editMode} onUpdate={handlers.updateSociety} eventHandlers={eventHandlers}
                    announcementHandlers={announcementHandlers} tags={tags} tagHandlers={tagHandlers}
                    focusAnnouncementId={focusAnnouncementId} onEditAnnouncement={onEditAnnouncement} />
            </div>
            <SocietySidebar society={society} editMode={editMode} tags={tags}
                onAddAnnouncement={handlers.addAnnouncement} onUpdateAnnouncement={handlers.updateAnnouncement} onAddEvent={handlers.addEvent} />
        </div>
    );
}
