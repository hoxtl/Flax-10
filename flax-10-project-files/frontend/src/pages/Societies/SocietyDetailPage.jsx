/**
 * SocietyDetailPage provides the comprehensive view for a single society.
 * Includes hero visuals, detailed info, event calendars, and administration tools.
 */
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
import { SocietyDetailSkeleton } from "./SocietySkeletons";
import { useUnreportSociety } from "../../components/Society/hooks/useUnreportSociety";

/** Manages the active tab and scroll orientation for the detail page. */
function usePageState(initialTab, location) {
    const [params, setParams] = useSearchParams();
    const activeTab = params.get('tab') || initialTab || location.state?.activeTab || "calendar";
    const focusId = params.get('announcementId') || location.state?.announcementId;

    const setTab = (tab, announcementId = null) => {
        setParams(prev => {
            prev.set('tab', tab);
            if (announcementId) prev.set('announcementId', announcementId);
            else prev.delete('announcementId');
            return prev;
        }, { replace: true });
    };

    return { activeTab, focusAnnouncementId: focusId, handleTabChange: setTab };
}

/** Container for all modular visibility states in the detail page. */
function useModalState() {
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [showCoverModal, setShowCoverModal] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    return {
        editingAnnouncement, setEditingAnnouncement, galleryOpen, setGalleryOpen,
        editMode, setEditMode, showCoverModal, setShowCoverModal,
        showSettings, setShowSettings, showReportModal, setShowReportModal,
        showMembersModal, setShowMembersModal
    };
}


/** Renders all potential overlay modals for the society view. */
function SocietyModals({ modals, society, handlers, members, updateSociety, updateLocalSociety, societyId, onBack }) {
    const { setEditingAnnouncement, setGalleryOpen, setShowCoverModal, setShowSettings, setShowReportModal, setShowMembersModal } = modals;
    const urls = getImageUrls(society.images);
    return (
        <>
            {modals.galleryOpen && <ImageGalleryModal images={urls} onClose={() => setGalleryOpen(false)} />}
            {modals.showCoverModal && <CoverImageModal images={urls} availablePhotos={getAvailablePhotos(society)} onClose={() => setShowCoverModal(false)} onUpdate={u => updateSociety({ images: u, image: u[0] || null })} />}
            {modals.showSettings && <SocietySettingsModal handlers={handlers} members={members} society={society} onBack={onBack} onClose={() => setShowSettings(false)} />}
            {modals.editingAnnouncement && <SocietyAnnouncementModal society={society} editing={modals.editingAnnouncement} handlers={handlers} setEditing={setEditingAnnouncement} societyId={societyId} />}
            {modals.showReportModal && <ReportSocietyModal society={society} onClose={() => setShowReportModal(false)} onReportSuccess={() => updateLocalSociety({ has_reported: true })} />}
            {modals.showMembersModal && <MemberDirectoryModal societyName={society.name} members={members} onFetchMembers={handlers.fetchMembers} onRemoveMember={handlers.removeMember} isAdmin={society.role === 'admin' || society.role === 'editor'} onClose={() => setShowMembersModal(false)} />}
        </>
    );
}

/** Specific wrapper for settings interaction logic. */
function SocietySettingsModal({ handlers, members, society, onBack, onClose }) {
    const handleDelete = async () => { await handlers.deleteSociety(); onBack(); };
    return <SettingsModal onClose={onClose} onDelete={handleDelete} members={members}
        onFetchMembers={handlers.fetchMembers} onUpdateRole={handlers.updateMemberRole}
        onRemoveMember={handlers.removeMember} onAddCollaborator={handlers.addCollaborator}
        ratificationStatus={society.ratification_status} isRatified={society.is_ratified}
        onRequestRatification={handlers.requestRatification} />;
}

/** Specific wrapper for announcement interaction logic. */
function SocietyAnnouncementModal({ society, editing, handlers, setEditing, societyId }) {
    const handleSubmit = (data, conflict) => {
        if (conflict) handlers.updateAnnouncement(conflict.id, { ...conflict, pinned: false });
        if (data.id) handlers.updateAnnouncement(data.id, data); else handlers.addAnnouncement(data);
        setEditing(null);
    };
    return <AnnouncementModal announcement={editing} tags={society.tags}
        onClose={() => setEditing(null)} onSubmit={handleSubmit} societyId={societyId}
        onDelete={(id) => { handlers.deleteAnnouncement(id, editing.title); setEditing(null); }}
        announcements={society.announcements} />;
}

/** Main view component for a society's detailed records. */
export default function SocietyDetailPage({ societyId, onBack, initialTab }) {
    const hookData = useSocietyDetail(societyId);
    const { society, loading, error, updateSociety, updateLocalSociety, publishChanges } = hookData;
    const location = useLocation();
    const page = usePageState(initialTab, location);
    const modals = useModalState();
    const handleUnreport = useUnreportSociety((id, fields) => updateLocalSociety(fields));
    const subscription = useSocietySubscription(societyId, society, updateLocalSociety);

    const tracker = useChangeTracker();
    useSocietyInit(location);
    const toggleEdit = () => handleToggleEditMode(modals, tracker, publishChanges);

    if (loading) return <SocietyDetailSkeleton />;
    if (error || !society) return <NotFound onBack={onBack} />;

    const handlers = buildHandlers(hookData, modals.editMode, tracker);

    return (
        <div className={styles.page}>
            <TopBar onBack={onBack} isAdmin={society.role === 'admin'} onSettings={() => modals.setShowSettings(true)} onReport={() => modals.setShowReportModal(true)} onUnreport={handleUnreport} hasReported={society.has_reported} />
            <SocietyHero society={society} onImageClick={() => modals.setGalleryOpen(true)} editMode={modals.editMode} onUpdateName={(name) => updateSociety({ name })} onEditImages={() => modals.setShowCoverModal(true)} />
            <SocietyInfo society={society} editMode={modals.editMode} onUpdateSociety={updateSociety} onJoin={handlers.joinSociety} onLeave={handlers.leaveSociety} canEdit={society.is_admin} onToggleEditMode={toggleEdit} onViewMembers={() => modals.setShowMembersModal(true)} isSubscribed={subscription.isSubscribed} onToggleSubscription={subscription.toggleSubscription} />
            <MainContent activeTab={page.activeTab} setActiveTab={page.handleTabChange} society={society} editMode={modals.editMode} handlers={handlers} focusAnnouncementId={page.focusAnnouncementId} onEditAnnouncement={modals.setEditingAnnouncement} />
            <SocietyModals modals={modals} society={society} handlers={handlers} members={hookData.members} updateSociety={updateSociety} updateLocalSociety={updateLocalSociety} societyId={societyId} onBack={onBack} />
        </div>
    );
}

/** Handles one-time initialization effects like scrolling to top. */
function useSocietyInit(location) {
    useEffect(() => {
        scrollContentToTop();
        if (location.state?.activeTab) window.history.replaceState({}, document.title);
    }, []);
}

/** Manages the transition between view and edit modes. */
async function handleToggleEditMode(modals, tracker, publish) {
    if (modals.editMode && tracker.hasChanges()) {
        await publish(tracker.getChangeSummary());
        tracker.resetChanges();
    }
    modals.setEditMode(!modals.editMode);
}

/** Constructs event operations bound to current editing context. */
function buildEventHandlers(hookData, editMode, trackEvent) {
    const { addEvent, updateEvent, deleteEvent, addException } = hookData;
    return {
        addEvent: wrapAddEvent(addEvent, editMode, trackEvent),
        updateEvent: wrapUpdateEvent(updateEvent, editMode, trackEvent),
        deleteEvent: wrapDeleteEvent(deleteEvent, editMode, trackEvent),
        addException: (eventId, date) => addException(eventId, date, editMode),
    };
}

/** Constructs announcement operations bound to current editing context. */
function buildAnnouncementHandlers(hookData, editMode, trackAnnouncement) {
    const { addAnnouncement, updateAnnouncement, deleteAnnouncement } = hookData;
    return {
        addAnnouncement: wrapAddAnnouncement(addAnnouncement, editMode, trackAnnouncement),
        updateAnnouncement: wrapUpdateAnnouncement(updateAnnouncement, editMode, trackAnnouncement),
        deleteAnnouncement: wrapDeleteAnnouncement(deleteAnnouncement, editMode, trackAnnouncement)
    };
}

/** Aggregates all data and action handlers for the page components. */
function buildHandlers(hookData, editMode, changeTracker) {
    const { trackEvent, trackAnnouncement } = changeTracker;
    return {
        ...hookData,
        ...buildEventHandlers(hookData, editMode, trackEvent),
        ...buildAnnouncementHandlers(hookData, editMode, trackAnnouncement),
        onAddTag: hookData.addTag,
        onDeleteTag: hookData.deleteTag,
        onUpdateTag: hookData.updateTag
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

/** Toggles the reporting status of the society. */
function ReportButton({ hasReported, onReport, onUnreport }) {
    const style = { color: hasReported ? 'var(--primary)' : 'var(--text-secondary)', padding: '0.4rem', cursor: 'pointer', opacity: hasReported ? 1 : 0.7 };
    const title = hasReported ? "You have reported this society. Click to unreport." : "Report Society";
    return (
        <button className={styles.settingsBtn} style={style} onClick={hasReported ? onUnreport : onReport} title={title}>
            <Flag size={20} fill={hasReported ? "currentColor" : "none"} strokeWidth={hasReported ? 1 : 2} />
        </button>
    );
}

/** Common header for the detail view including navigation and settings. */
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

/** Simple error display when a society record is missing. */
function NotFound({ onBack }) {
    return (
        <div className={styles.notFound}>
            <p>Society not found.</p>
            <button onClick={onBack}>Back to Societies</button>
        </div>
    );
}

/** Orchestrates the primary content sections (Tabs and Sidebar). */
function MainContent({ activeTab, setActiveTab, society, editMode, handlers, focusAnnouncementId, onEditAnnouncement }) {
    const tags = society.tags || [];
    return (
        <div className={styles.mainContent}>
            <div className={styles.tabSection}>
                <SocietyTabs activeTab={activeTab} onTabChange={setActiveTab} society={society}
                    editMode={editMode} onUpdate={handlers.updateSociety}
                    eventHandlers={wrapEventHandlers(handlers)}
                    announcementHandlers={handlers} tags={tags} tagHandlers={handlers}
                    focusAnnouncementId={focusAnnouncementId} onEditAnnouncement={onEditAnnouncement} />
            </div>
            <SocietySidebar society={society} editMode={editMode} tags={tags}
                onAddAnnouncement={handlers.addAnnouncement} onUpdateAnnouncement={handlers.updateAnnouncement} onAddEvent={handlers.addEvent} />
        </div>
    );
}

function wrapEventHandlers(handlers) {
    return { onAdd: handlers.addEvent, onUpdate: handlers.updateEvent, onDelete: handlers.deleteEvent, onAddException: handlers.addException };
}

/** Scrolls the viewport to the very top. */
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
