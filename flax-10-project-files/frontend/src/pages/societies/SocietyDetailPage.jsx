/**
 * SocietyDetailPage provides the comprehensive view for a single society.
 * Includes hero visuals, detailed info, event calendars, and administration tools.
 */

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
import { SocietyDetailSkeleton } from "./SocietySkeletons";
import BackButton from "../../components/common/back_button/BackButton.jsx";
import Breadcrumb from "../../components/common/Breadcrumb/Breadcrumb.jsx";
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

const ModalsContainer = ({ state, data, handlers, societyId }) => {
    const isAdmin = data.society && ['admin', 'editor'].includes(data.society.role);
    const urls = getImageUrls(data.society?.images);
    return (
        <>
            {state.showSettings && <SettingsModal onClose={() => handlers.setS(false)} onDelete={handlers.onDelete} members={data.members} onFetchMembers={handlers.fetchM} onUpdateRole={data.updateMemberRole} onRemoveMember={handlers.removeM} onAddCollaborator={data.addCollaborator} ratificationStatus={data.society.ratification_status} isRatified={data.society.is_ratified} onRequestRatification={data.requestRatification} />}
            {state.showReportModal && <ReportSocietyModal society={data.society} onClose={() => handlers.setR(false)} onReportSuccess={() => handlers.updateLS({ has_reported: true })} />}
            {state.galleryOpen && <ImageGalleryModal images={urls} initialIndex={state.galleryOpen?.index} onClose={() => handlers.setG(null)} />}
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
            onReport={() => handlers.onReport()} hasReported={data.society.has_reported} onUnreport={() => data.handleUnreport(data.society)}
            societyName={data.society.name} />
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

/** Manages the transition between view and edit modes. */

async function handleToggleEditMode(modals, tracker, publish) {
    if (modals.editMode && tracker.hasChanges()) {
        await publish(tracker.getChangeSummary());
        tracker.resetChanges();
    }
    modals.setEditMode(!modals.editMode);
}

/** Toggles the reporting status of the society. */

function ReportButton({ hasReported, onReport, onUnreport }) {
    const title = hasReported ? "You have reported this society. Click to unreport." : "Report Society";
    return (
        <button
            className={`${styles.settingsBtn} ${styles.reportBtn} ${hasReported ? styles.reportedBtn : ''}`}
            onClick={hasReported ? onUnreport : onReport}
            title={title}
            type="button"
        >
            <Flag className={styles.reportBtnIcon} size={24} fill={hasReported ? "currentColor" : "none"} strokeWidth={hasReported ? 1 : 2} />
        </button>
    );
}

/** Common header for the detail view including navigation and settings. */

function TopBar({ onBack, isAdmin, onSettings, onReport, onUnreport, hasReported, societyName }) {
    const crumbs = [
        { label: "Societies", navKey: "societies" },
        { label: societyName || "Society" },
    ];
    return (
        <div className={styles.topBar}>
            <div>
                <Breadcrumb crumbs={crumbs} />
                <BackButton onClick={onBack} label="Back to All Societies" />
            </div>
            <div className={styles.topBarActions}>
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
            <BackButton onClick={onBack} label="Back to Societies" />
        </div>
    );
}
