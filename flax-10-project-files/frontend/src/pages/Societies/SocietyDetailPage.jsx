/**
 * SocietyDetailPage provides the comprehensive view for a single society.
 * Includes hero visuals, detailed info, event calendars, and administration tools.
 */
<<<<<<< HEAD

=======
import { useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import styles from "./SocietyDetailPage.module.css";
import SocietyHero from "../../components/society/society_detail/SocietyHero";
import SocietyInfo from "../../components/society/society_detail/SocietyInfo";
import SocietyTabs from "../../components/society/society_detail/tabs/SocietyTabs";
import SocietySidebar from "../../components/society/society_detail/SocietySidebar";
import CoverImageModal from "../../components/society/society_detail/image_handlers/CoverImageModal";
import ImageGalleryModal from "../../components/society/society_detail/image_handlers/ImageGalleryModal";
import SettingsModal from "../../components/society/society_detail/SettingsModal";
import AnnouncementModal from "../../components/society/society_detail/tabs/announcement_tab/AnnouncementModal";
import ReportSocietyModal from "../../components/society/society_detail/ReportSocietyModal";
import MemberDirectoryModal from "../../components/society/society_detail/MemberDirectoryModal";
import { Flag } from "lucide-react";
<<<<<<< HEAD
import { SocietyDetailSkeleton } from "./SocietySkeletons";
import BackButton from "../../components/common/back_button/BackButton.jsx";
import { useLocation } from "react-router-dom";
import { useSocietyInit, useSocietyPageData } from "./useSocietyDetailPageState";
import { getImageUrls } from "./societyDetailPageUtils";

function usePageStateHandlers(data, onBack, onDeleteCallback) {
    const { modals, updateSociety, updateLocalSociety, fetchMembers, removeMember, deleteSociety } = data;
    return {
        state: modals,
        setS: modals.setShowSettings, setR: modals.setShowReportModal, setG: modals.setGalleryOpen,
        setCE: modals.setShowCoverModal, setM: modals.setShowMembersModal, setEA: modals.setEditingAnnouncement,
        updateS: updateSociety, updateLS: updateLocalSociety, fetchM: fetchMembers, removeM: removeMember,
        onDelete: async () => { await deleteSociety(); onDeleteCallback?.(); onBack(); },
        onReport: () => modals.setShowReportModal(true),
        onAnnounceSubmit: (d, conflict) => {
            if (conflict) data.updateAnnouncement(conflict.id, { ...conflict, pinned: false }, false);
            if (d.id) data.updateAnnouncement(d.id, d, false); else data.addAnnouncement(d, false);
            modals.setEditingAnnouncement(null);
        },
        onAnnounceDelete: (id) => { data.deleteAnnouncement(id, false); modals.setEditingAnnouncement(null); }
    };
}

=======
import { useSocietySubscription } from "../../components/Society/hooks/useSocietySubscription";
import { SocietyDetailSkeleton } from "./SocietySkeletons";
import { useUnreportSociety } from "../../components/Society/hooks/useUnreportSociety";
import BackButton from "../../components/common/BackButton/BackButton.jsx";

import {
    getImageUrls, scrollContentToTop,
    wrapAddEvent, wrapUpdateEvent, wrapDeleteEvent,
    wrapAddAnnouncement, wrapUpdateAnnouncement, wrapDeleteAnnouncement
} from "./SocietyDetailPageUtils";

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


/** Aggregates all data and action handlers for the page components. */
function useSocietyPageData(societyId, initialTab, onMembershipChange) {
    const hookData = useSocietyDetail(societyId, onMembershipChange);
    const { society, updateLocalSociety } = hookData;
    const location = useLocation();
    const page = usePageState(initialTab, location);
    const modals = useModalState();
    const handleUnreport = useUnreportSociety((id, fields) => updateLocalSociety(fields));
    const subscription = useSocietySubscription(societyId, society, updateLocalSociety);
    const tracker = useChangeTracker();
    const handlers = buildHandlers(hookData, modals.editMode, tracker);
    return { ...handlers, page, modals, handleUnreport, subscription, tracker };
}

function usePageStateHandlers(data, onBack, onDeleteCallback) {
    const { modals, updateSociety, updateLocalSociety, fetchMembers, removeMember, deleteSociety } = data;
    return {
        state: modals,
        setS: modals.setShowSettings, setR: modals.setShowReportModal, setG: modals.setGalleryOpen,
        setCE: modals.setShowCoverModal, setM: modals.setShowMembersModal, setEA: modals.setEditingAnnouncement,
        updateS: updateSociety, updateLS: updateLocalSociety, fetchM: fetchMembers, removeM: removeMember,
        onDelete: async () => { await deleteSociety(); onDeleteCallback?.(); onBack(); },
        onReport: () => modals.setShowReportModal(true),
        onAnnounceSubmit: (d, conflict) => {
            if (conflict) data.updateAnnouncement(conflict.id, { ...conflict, pinned: false }, false);
            if (d.id) data.updateAnnouncement(d.id, d, false); else data.addAnnouncement(d, false);
            modals.setEditingAnnouncement(null);
        },
        onAnnounceDelete: (id) => { data.deleteAnnouncement(id, false); modals.setEditingAnnouncement(null); }
    };
}

>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
const ModalsContainer = ({ state, data, handlers, societyId }) => {
    const isAdmin = data.society && ['admin', 'editor'].includes(data.society.role);
    const urls = getImageUrls(data.society?.images);
    return (
        <>
            {state.showSettings && <SettingsModal onClose={() => handlers.setS(false)} onDelete={handlers.onDelete} members={data.members} onFetchMembers={handlers.fetchM} onUpdateRole={data.updateMemberRole} onRemoveMember={handlers.removeM} onAddCollaborator={data.addCollaborator} ratificationStatus={data.society.ratification_status} isRatified={data.society.is_ratified} onRequestRatification={data.requestRatification} />}
            {state.showReportModal && <ReportSocietyModal society={data.society} onClose={() => handlers.setR(false)} onReportSuccess={() => handlers.updateLS({ has_reported: true })} />}
<<<<<<< HEAD
            {state.galleryOpen && <ImageGalleryModal images={urls} initialIndex={state.galleryOpen?.index} onClose={() => handlers.setG(null)} />}
=======
            {state.galleryOpen && <ImageGalleryModal images={urls} initialIndex={state.activeGallery?.index} onClose={() => handlers.setG(null)} />}
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
            {state.showCoverModal && <CoverImageModal images={urls} onClose={() => handlers.setCE(false)} onUpdate={(imgs) => handlers.updateS({ images: imgs, image: imgs[0] || null })} />}
            {state.showMembersModal && <MemberDirectoryModal societyName={data.society.name} members={data.members} onFetchMembers={handlers.fetchM} onRemoveMember={handlers.removeM} isAdmin={isAdmin} onClose={() => handlers.setM(false)} />}
            {state.editingAnnouncement && <AnnouncementModal announcements={data.society.announcements} announcement={state.editingAnnouncement} societyId={societyId} onClose={() => handlers.setEA(null)} onSubmit={(d, conflict) => handlers.onAnnounceSubmit(d, conflict)} onDelete={(id) => handlers.onAnnounceDelete(id)} tags={data.society.tags} />}
        </>
    );
};

const TabSection = ({ data }) => (
    <div className={styles.tabSection}>
        <SocietyTabs activeTab={data.page.activeTab} onTabChange={data.page.handleTabChange}
            society={data.society} editMode={data.modals.editMode} onUpdate={data.updateSociety}
            eventHandlers={{ onAdd: data.addEvent, onUpdate: data.updateEvent, onDelete: data.deleteEvent, onAddException: data.addException }}
            announcementHandlers={{ addAnnouncement: data.addAnnouncement, updateAnnouncement: data.updateAnnouncement, deleteAnnouncement: data.deleteAnnouncement }}
            tags={data.society.tags}
            tagHandlers={{ onAddTag: data.onAddTag, onDeleteTag: data.onDeleteTag, onUpdateTag: data.onUpdateTag }}
            focusAnnouncementId={data.page.focusAnnouncementId} onEditAnnouncement={data.modals.setEditingAnnouncement} />
    </div>
);

const DetailLayout = ({ data, handlers, onBack, isAdmin }) => (
    <div className={styles.page}>
        <TopBar onBack={onBack} onSettings={() => handlers.setS(true)} isAdmin={isAdmin}
            onReport={() => handlers.onReport()} hasReported={data.society.has_reported} onUnreport={() => data.handleUnreport(data.society)} />
        <SocietyHero society={data.society} editMode={data.modals.editMode} onUpdateName={(name) => data.updateSociety({ name })}
            onImageClick={(index) => handlers.setG({ index })} onEditImages={() => handlers.setCE(true)} />
        <SocietyInfo society={data.society} editMode={data.modals.editMode} onUpdateSociety={data.updateSociety}
            isSubscribed={data.subscription.isSubscribed} onJoin={data.joinSociety} onLeave={data.leaveSociety}
            canEdit={data.society.is_admin} onViewMembers={() => handlers.setM(true)} onToggleSubscription={data.subscription.toggleSubscription}
            onToggleEditMode={() => handleToggleEditMode(data.modals, data.tracker, data.publishChanges)} />
        <div className={styles.mainContent}>
            <TabSection data={data} />
            <SocietySidebar society={data.society} editMode={data.modals.editMode} onAddAnnouncement={data.addAnnouncement}
                onUpdateAnnouncement={data.updateAnnouncement} onAddEvent={data.addEvent} tags={data.society.tags} />
        </div>
    </div>
);

export default function SocietyDetailPage({ societyId, onBack, initialTab, onMembershipChange, onDelete }) {
    const data = useSocietyPageData(societyId, initialTab, onMembershipChange);
    const handlers = usePageStateHandlers(data, onBack, onDelete);
    const activeTabState = useLocation().state?.activeTab;
    useSocietyInit(activeTabState);
    if (data.loading) return <SocietyDetailSkeleton />;
    if (!data.society) return <NotFound onBack={onBack} />;
    const isAdmin = ['admin', 'editor'].includes(data.society.role);

    return (
        <>
            <DetailLayout data={data} handlers={handlers} onBack={onBack} isAdmin={isAdmin} />
            <ModalsContainer state={handlers.state} data={data} handlers={handlers} societyId={societyId} />
        </>
    );
}

<<<<<<< HEAD
/** Manages the transition between view and edit modes. */

async function handleToggleEditMode(modals, tracker, publish) {
    if (modals.editMode && tracker.hasChanges()) {
        await publish(tracker.getChangeSummary());
        tracker.resetChanges();
    }
    modals.setEditMode(!modals.editMode);
}

/** Toggles the reporting status of the society. */

=======
/** Handles one-time initialization effects like scrolling to top. */
function useSocietyInit(activeTabState) {
    useEffect(() => {
        scrollContentToTop();
        if (activeTabState) window.history.replaceState({}, document.title);
    }, [activeTabState]);
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

/** Toggles the reporting status of the society. */
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function TopBar({ onBack, isAdmin, onSettings, onReport, onUnreport, hasReported }) {
    return (
        <div className={styles.topBar}>
            <BackButton onClick={onBack} label="Back to All Societies" />
<<<<<<< HEAD
            <div className={styles.topBarActions}>
=======
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
                <ReportButton hasReported={hasReported} onReport={onReport} onUnreport={onUnreport} />
                {isAdmin && <button className={styles.settingsBtn} onClick={onSettings} title="Settings">⚙</button>}
            </div>
        </div>
    );
}

/** Simple error display when a society record is missing. */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
function NotFound({ onBack }) {
    return (
        <div className={styles.notFound}>
            <p>Society not found.</p>
            <BackButton onClick={onBack} label="Back to Societies" />
        </div>
    );
}
