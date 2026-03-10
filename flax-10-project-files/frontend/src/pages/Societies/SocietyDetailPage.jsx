import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import styles from "./SocietyDetailPage.module.css";
import { useSocietyDetail } from "../../components/Society/hooks/useSocietyDetail";
import { useChangeTracker } from "../../components/Society/hooks/useChangeTracker";
import SocietyHero from "../../components/Society/SocietyDetail/SocietyHero";
import SocietyInfo from "../../components/Society/SocietyDetail/SocietyInfo";
import SocietyTabs from "../../components/Society/SocietyDetail/tabs/SocietyTabs";
import SocietySidebar from "../../components/Society/SocietyDetail/SocietySidebar";
import CoverImageModal from "../../components/Society/SocietyDetail/imageHandlers/CoverImageModal";
import ImageGalleryModal from "../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal";
import SettingsModal from "../../components/Society/SocietyDetail/SettingsModal";
import AnnouncementModal from "../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal";
import ReportSocietyModal from "../../components/Society/SocietyDetail/ReportSocietyModal";
import MemberDirectoryModal from "../../components/Society/SocietyDetail/MemberDirectoryModal";
import { Flag } from "lucide-react";
import { useConfirm } from "../../context/ConfirmContext";
import { unreportSociety } from "../../api/societyApi";
import { useSocietySubscription } from "../../components/Society/hooks/useSocietySubscription";

function usePageState(initialTab, location) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Read from search params primarily, fallback to prop or location state, then "calendar"
    const activeTab = searchParams.get('tab') || initialTab || location.state?.activeTab || "calendar";
    const focusAnnouncementId = searchParams.get('announcementId') || location.state?.announcementId || null;

    const handleTabChange = (tab, announcementId = null) => {
        setSearchParams(prev => {
            prev.set('tab', tab);
            if (announcementId) prev.set('announcementId', announcementId);
            else prev.delete('announcementId');
            return prev;
        }, { replace: true });
    };

    return { activeTab, focusAnnouncementId, handleTabChange };
}

function useModalState() {
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showCoverModal, setShowCoverModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    return { editingAnnouncement, setEditingAnnouncement, galleryOpen, setGalleryOpen, editMode, setEditMode, showCoverModal, setShowCoverModal, showSettings, setShowSettings, showReportModal, setShowReportModal, showMembersModal, setShowMembersModal };
}

function useUnreport(society, updateLocalSociety, confirm) {
    const doUnreport = async () => {
        try { await unreportSociety(society.id); updateLocalSociety({ has_reported: false }); }
        catch (e) { console.error("Failed to unreport society:", e); }
    };
    return async () => {
        const ok = await confirm({ title: "Unreport Society", message: `Are you sure you want to remove your report for ${society.name}?`, confirmText: "Unreport", cancelText: "Cancel", confirmStyle: "danger" });
        if (ok) doUnreport();
    };
}

function SocietyModals({ modals, society, handlers, members, updateSociety, updateLocalSociety, societyId, onBack }) {
    const { editingAnnouncement, setEditingAnnouncement, galleryOpen, setGalleryOpen, showCoverModal, setShowCoverModal, showSettings, setShowSettings, showReportModal, setShowReportModal, showMembersModal, setShowMembersModal } = modals;
    const updateImages = (imgs) => updateSociety({ images: imgs, image: imgs[0] || null });
    const handleDelete = async () => { await handlers.deleteSociety(); onBack(); };
    const handleAnnouncementSubmit = (data, conflict) => {
        if (conflict) handlers.updateAnnouncement(conflict.id, { ...conflict, pinned: false });
        if (data.id) handlers.updateAnnouncement(data.id, data); else handlers.addAnnouncement(data);
        setEditingAnnouncement(null);
    };
    return (
        <>
            {galleryOpen && <ImageGalleryModal images={getImageUrls(society.images)} onClose={() => setGalleryOpen(false)} />}
            {showCoverModal && <CoverImageModal images={getImageUrls(society.images)} availablePhotos={getAvailablePhotos(society)} onClose={() => setShowCoverModal(false)} onUpdate={updateImages} />}
            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onDelete={handleDelete} members={members} onFetchMembers={handlers.fetchMembers} onUpdateRole={handlers.updateMemberRole} onRemoveMember={handlers.removeMember} onAddCollaborator={handlers.addCollaborator} ratificationStatus={society.ratification_status} isRatified={society.is_ratified} onRequestRatification={handlers.requestRatification} />}
            {editingAnnouncement && <AnnouncementModal announcement={editingAnnouncement} tags={society.tags} onClose={() => setEditingAnnouncement(null)} onDelete={(id) => { handlers.deleteAnnouncement(id, editingAnnouncement.title); setEditingAnnouncement(null); }} onSubmit={handleAnnouncementSubmit} societyId={societyId} announcements={society.announcements} />}
            {showReportModal && <ReportSocietyModal society={society} onClose={() => setShowReportModal(false)} onReportSuccess={() => updateLocalSociety({ has_reported: true })} />}
            {showMembersModal && <MemberDirectoryModal societyName={society.name} members={members} onFetchMembers={handlers.fetchMembers} onRemoveMember={handlers.removeMember} isAdmin={society.role === 'admin' || society.role === 'editor'} onClose={() => setShowMembersModal(false)} />}
        </>
    );
}

function SocietyDetailSkeleton() {
  return (
    <div className={styles.page}>
      <div className={styles.skelTopBar}>
        <div className={`${styles.skel} ${styles.skelBackBtn}`} />
      </div>
      <div className={`${styles.skel} ${styles.skelHero}`} />
      <div className={styles.skelTabRow}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${styles.skel} ${styles.skelTab}`} style={{ animationDelay: `${i * 0.06}s` }} />
        ))}
      </div>
      <div className={styles.skelBody}>
        <div className={styles.skelMain}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`${styles.skel} ${styles.skelBlock}`} style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <div className={`${styles.skel} ${styles.skelSidePanel}`} />
      </div>
    </div>
  );
}

export default function SocietyDetailPage({ societyId, onBack, initialTab }) {
    const hookData = useSocietyDetail(societyId);
    const { society, loading, error, updateSociety, updateLocalSociety, members, publishChanges } = hookData;
    const changeTracker = useChangeTracker();
    const location = useLocation();
    const confirm = useConfirm();
    const page = usePageState(initialTab, location);
    const modals = useModalState();
    const handleUnreport = useUnreport(society, updateLocalSociety, confirm);
    const subscription = useSocietySubscription(societyId, society, updateLocalSociety);

    useEffect(() => { scrollContentToTop(); if (location.state?.activeTab) window.history.replaceState({}, document.title); }, []);

    const handleToggleEditMode = async () => {
        if (modals.editMode && changeTracker.hasChanges()) { await publishChanges(changeTracker.getChangeSummary()); changeTracker.resetChanges(); }
        modals.setEditMode(!modals.editMode);
    };

    if (loading) return <SocietyDetailSkeleton />;
    if (error || !society) return <NotFound onBack={onBack} />;

    const handlers = buildHandlers(hookData, modals.editMode, changeTracker);

    return (
        <div className={styles.page}>
            <TopBar onBack={onBack} isAdmin={society.role === 'admin'} onSettings={() => modals.setShowSettings(true)} onReport={() => modals.setShowReportModal(true)} onUnreport={handleUnreport} hasReported={society.has_reported} />
            <SocietyHero society={society} onImageClick={() => modals.setGalleryOpen(true)} editMode={modals.editMode} onUpdateName={(name) => updateSociety({ name })} onEditImages={() => modals.setShowCoverModal(true)} />
            <SocietyInfo society={society} editMode={modals.editMode} onUpdateSociety={updateSociety} onJoin={handlers.joinSociety} onLeave={handlers.leaveSociety} canEdit={society.is_admin} onToggleEditMode={handleToggleEditMode} onViewMembers={() => modals.setShowMembersModal(true)}
                isSubscribed={subscription.isSubscribed} onToggleSubscription={subscription.toggleSubscription} />
            <MainContent activeTab={page.activeTab} setActiveTab={page.handleTabChange} society={society} editMode={modals.editMode} handlers={handlers} focusAnnouncementId={page.focusAnnouncementId} onEditAnnouncement={modals.setEditingAnnouncement} />
            <SocietyModals modals={modals} society={society} handlers={handlers} members={members} updateSociety={updateSociety} updateLocalSociety={updateLocalSociety} societyId={societyId} onBack={onBack} />
        </div>
    );
}

function buildEventHandlers(hookData, editMode, trackEvent) {
    const { addEvent, updateEvent, deleteEvent, addException } = hookData;
    return {
        addEvent: wrapAddEvent(addEvent, editMode, trackEvent),
        updateEvent: wrapUpdateEvent(updateEvent, editMode, trackEvent),
        deleteEvent: wrapDeleteEvent(deleteEvent, editMode, trackEvent),
        addException: (eventId, date) => addException(eventId, date, editMode),
    };
}

function buildAnnouncementHandlers(hookData, editMode, trackAnnouncement) {
    const { addAnnouncement, updateAnnouncement, deleteAnnouncement } = hookData;
    return {
        addAnnouncement: wrapAddAnnouncement(addAnnouncement, editMode, trackAnnouncement),
        updateAnnouncement: wrapUpdateAnnouncement(updateAnnouncement, editMode, trackAnnouncement),
        deleteAnnouncement: wrapDeleteAnnouncement(deleteAnnouncement, editMode, trackAnnouncement)
    };
}

function buildHandlers(hookData, editMode, changeTracker) {
    const { trackEvent, trackAnnouncement } = changeTracker;
    return {
        ...hookData, ...buildEventHandlers(hookData, editMode, trackEvent),
        ...buildAnnouncementHandlers(hookData, editMode, trackAnnouncement)
    };
}

function wrapAddEvent(addEvent, silent, track) {
    return async (data) => {
        const result = await addEvent(data, silent);
        if (silent) track('Added', data.title);
        return result;
    };
}

function wrapUpdateEvent(updateEvent, silent, track) {
    return async (eventId, data) => {
        const result = await updateEvent(eventId, data, silent);
        if (silent) track('Updated', data.title);
        return result;
    };
}

function wrapDeleteEvent(deleteEvent, silent, track) {
    return async (eventId, title = 'Event') => {
        await deleteEvent(eventId, silent);
        if (silent) track('Deleted', title);
    };
}

function wrapAddAnnouncement(addAnnouncement, silent, track) {
    return async (data) => {
        const result = await addAnnouncement(data, silent);
        if (silent) track('Added', data.title);
        return result;
    };
}

function wrapUpdateAnnouncement(updateAnnouncement, silent, track) {
    return async (announcementId, data) => {
        const result = await updateAnnouncement(announcementId, data, silent);
        if (silent) track('Updated', data.title);
        return result;
    };
}

function wrapDeleteAnnouncement(deleteAnnouncement, silent, track) {
    return async (announcementId, title = 'Announcement') => {
        await deleteAnnouncement(announcementId, silent);
        if (silent) track('Deleted', title);
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

function ReportButton({ hasReported, onReport, onUnreport }) {
    const style = { color: hasReported ? 'var(--primary)' : 'var(--text-secondary)', padding: '0.4rem', cursor: 'pointer', opacity: hasReported ? 1 : 0.7 };
    const title = hasReported ? "You have reported this society. Click to unreport." : "Report Society";
    return (
        <button className={styles.settingsBtn} style={style} onClick={hasReported ? onUnreport : onReport} title={title}>
            <Flag size={20} fill={hasReported ? "currentColor" : "none"} strokeWidth={hasReported ? 1 : 2} />
        </button>
    );
}

function TopBar({ onBack, isAdmin, onSettings, onReport, onUnreport, hasReported }) {
    return (
        <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={onBack}>&larr; Back to Societies</button>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
                <ReportButton hasReported={hasReported} onReport={onReport} onUnreport={onUnreport} />
                {isAdmin && <button className={styles.settingsBtn} onClick={onSettings} title="Settings">⚙</button>}
            </div>
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

function scrollContentToTop() {
    const scrollable = findScrollableParent(document.body);
    if (scrollable) scrollable.scrollTop = 0;
    window.scrollTo(0, 0);
}

function findScrollableParent(element) {
    const containers = document.querySelectorAll('*');
    for (const el of containers) {
        const style = window.getComputedStyle(el);
        const isScrollable = style.overflow === 'auto' || style.overflowY === 'auto';
        if (isScrollable && el.scrollHeight > el.clientHeight) return el;
    }
    return null;
}
