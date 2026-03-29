/*
 * Society detail page with hero, content tabs, sidebar, and modal controls.
 */

import { useRef } from "react";
import styles from "../styles/SocietyDetailPage.module.css";
import SocietyHero from "../../../components/society/society_detail/SocietyHero";
import SocietyInfo from "../../../components/society/society_detail/SocietyInfo";
import SocietyTabs from "../../../components/society/society_detail/tabs/SocietyTabs";
import SocietySidebar from "../../../components/society/society_detail/SocietySidebar";
import SettingsModal from "../../../components/society/society_detail/SettingsModal";
import AnnouncementModal from "../../../components/society/society_detail/tabs/announcement_tab/AnnouncementModal";
import ReportSocietyModal from "../../../components/society/society_detail/ReportSocietyModal";
import MemberDirectoryModal from "../../../components/society/society_detail/MemberDirectoryModal";
import { Flag, Settings } from "lucide-react";
import { SocietyDetailSkeleton } from "./SocietySkeletons";
import BackButton from "../../../components/common/back_button/BackButton.jsx";
import Breadcrumb from "../../../components/common/Breadcrumb/Breadcrumb.jsx";
import SocietyInsightBanner from "../../../components/society/society_detail/SocietyInsightBanner.jsx";
import Tooltip from "../../../components/common/tooltip/Tooltip.jsx";
import { useLocation } from "react-router-dom";
import { getSeedAnnouncements } from "../../../components/society/utils/seedAnnouncements.js";
import { useSocietyInit, useSocietyPageData } from "../hooks/useSocietyDetailPageState";
import { getImageUrls } from "../utils/societyDetailPageUtils";
import { readImageFile, resetFileInput } from "../../../utils/imageFile";

function usePageStateHandlers(data, onBack, onDeleteCallback) {
    const { modals, updateSociety, updateLocalSociety, fetchMembers, removeMember, deleteSociety } = data;
    return {
        state: modals,
    setS: modals.setShowSettings, setR: modals.setShowReportModal,
        setM: modals.setShowMembersModal, setEA: modals.setEditingAnnouncement,
        updateS: updateSociety, updateLS: updateLocalSociety, fetchM: fetchMembers, removeM: removeMember,
        onDelete: async () => { await deleteSociety(); onDeleteCallback?.(); onBack(); },
        onReport: () => modals.setShowReportModal(true),
        onAnnounceSubmit: (announcement, conflict) => handleAnnouncementSubmit(data, modals, announcement, conflict),
        onAnnounceDelete: (id) => handleAnnouncementDelete(data, modals, id)
    };
}

function handleAnnouncementSubmit(data, modals, announcement, conflict) {
    if (conflict) data.updateAnnouncement(conflict.id, { ...conflict, pinned: false }, false);
    if (announcement.id) data.updateAnnouncement(announcement.id, announcement, false);
    if (!announcement.id) data.addAnnouncement(announcement, false);
    modals.setEditingAnnouncement(null);
}

function handleAnnouncementDelete(data, modals, id) {
    data.deleteAnnouncement(id, false);
    modals.setEditingAnnouncement(null);
}

const ModalsContainer = ({ state, data, handlers, societyId }) => {
    const isAdmin = data.society && ["admin", "editor"].includes(data.society.role);
    const urls = getImageUrls(data.society?.images);
    return (
        <>
            {state.showSettings && <SettingsModal onClose={() => handlers.setS(false)} onDelete={handlers.onDelete} members={data.members} onFetchMembers={handlers.fetchM} onUpdateRole={data.updateMemberRole} onRemoveMember={handlers.removeM} onAddCollaborator={data.addCollaborator} ratificationStatus={data.society.ratification_status} isRatified={data.society.is_ratified} onRequestRatification={data.requestRatification} />}
            {state.showReportModal && <ReportSocietyModal society={data.society} onClose={() => handlers.setR(false)} onReportSuccess={() => handlers.updateLS({ has_reported: true })} />}
            {state.showMembersModal && <MemberDirectoryModal societyName={data.society.name} members={data.members} onFetchMembers={handlers.fetchM} onRemoveMember={handlers.removeM} isAdmin={isAdmin} onClose={() => handlers.setM(false)} />}
            {state.editingAnnouncement && <AnnouncementModal announcements={data.society.announcements} announcement={state.editingAnnouncement} societyId={societyId} onClose={() => handlers.setEA(null)} onSubmit={(announcement, conflict) => handlers.onAnnounceSubmit(announcement, conflict)} onDelete={(id) => handlers.onAnnounceDelete(id)} tags={data.society.tags} />}
        </>
    );
};

function getDisplaySociety(society, editMode) {
    return { ...society, announcements: getSeedAnnouncements(society, editMode) };
}

function buildInfoProps(data, society) {
    return {
        society,
        editMode: data.modals.editMode,
        onUpdateSociety: data.updateSociety,
        isSubscribed: data.subscription.isSubscribed,
        onJoin: data.joinSociety,
        onLeave: data.leaveSociety,
        canEdit: data.society.is_admin,
        onToggleSubscription: data.subscription.toggleSubscription,
        onToggleEditMode: () => handleToggleEditMode(data.modals, data.tracker, data.publishChanges),
        membershipAction: data.membershipAction,
    };
}

const TabSection = ({ data, society }) => (
    <div className={styles.tabSection}>
        <SocietyTabs activeTab={data.page.activeTab} onTabChange={data.page.handleTabChange} society={society} editMode={data.modals.editMode} onUpdate={data.updateSociety} eventHandlers={{ onAdd: data.addEvent, onUpdate: data.updateEvent, onDelete: data.deleteEvent, onAddException: data.addException }} announcementHandlers={{ addAnnouncement: data.addAnnouncement, updateAnnouncement: data.updateAnnouncement, deleteAnnouncement: data.deleteAnnouncement }} tags={society.tags} tagHandlers={{ onAddTag: data.onAddTag, onDeleteTag: data.onDeleteTag, onUpdateTag: data.onUpdateTag }} focusAnnouncementId={data.page.focusAnnouncementId} onEditAnnouncement={data.modals.setEditingAnnouncement} />
    </div>
);

const DetailMainContent = ({ data, isAdmin, society }) => (
    <>
        {!isAdmin && <div className={styles.insightBannerWrap}><SocietyInsightBanner society={society} /></div>}
        <div className={styles.mainContent}>
            <TabSection data={data} society={society} />
            <SocietySidebar society={society} editMode={data.modals.editMode} onAddAnnouncement={data.addAnnouncement} onUpdateAnnouncement={data.updateAnnouncement} onAddEvent={data.addEvent} tags={data.society.tags} />
        </div>
    </>
);

function DetailHero({ data, handlers, isAdmin, society, onEditCover }) {
    const infoProps = buildInfoProps(data, society);
    return (
        <SocietyHero society={society} editMode={data.modals.editMode} onUpdateName={(name) => data.updateSociety({ name })} onUpdateBio={(bio) => data.updateSociety({ bio })} onViewMembers={() => handlers.setM(true)} onEditImages={onEditCover} actionContent={<HeroActionButtons isAdmin={isAdmin} onSettings={() => handlers.setS(true)} onReport={() => handlers.onReport()} onUnreport={() => data.handleUnreport(data.society)} hasReported={data.society.has_reported} />} metaContent={<SocietyInfo {...infoProps} showBio={false} showLocation={false} layout="hero" />} />
    );
}

function DetailSummary({ data, society }) {
    return <SocietyInfo {...buildInfoProps(data, society)} showBio={false} showMeta={false} />;
}

const DetailLayout = ({ data, handlers, onBack, isAdmin, onEditCover }) => {
    const displaySociety = getDisplaySociety(data.society, data.modals.editMode);
    return (
        <div className={styles.page}>
            <TopBar onBack={onBack} societyName={data.society.name} />
            <DetailHero data={data} handlers={handlers} isAdmin={isAdmin} society={displaySociety} onEditCover={onEditCover} />
            <DetailSummary data={data} society={displaySociety} />
            <DetailMainContent data={data} isAdmin={isAdmin} society={displaySociety} />
        </div>
    );
};

/** Shows the full society detail experience, including tabs, hero actions, and admin modals. */

export default function SocietyDetailPage({ societyId, onBack, initialTab, onMembershipChange, onDelete }) {
    const data = useSocietyPageData(societyId, initialTab, onMembershipChange);
    const handlers = usePageStateHandlers(data, onBack, onDelete);
    const activeTabState = useLocation().state?.activeTab;
    useSocietyInit(activeTabState);
    if (data.loading) return <SocietyDetailSkeleton />;
    if (!data.society) return <NotFound onBack={onBack} />;
    return <SocietyDetailPageView data={data} handlers={handlers} onBack={onBack} societyId={societyId} />;
}

function SocietyDetailPageView({ data, handlers, onBack, societyId }) {
    const isAdmin = ["admin", "editor"].includes(data.society.role);
    const coverPicker = useCoverImagePicker((src) => handlers.updateS({ images: src ? [src] : [], image: src || null }));
    return (
        <>
            <DetailLayout data={data} handlers={handlers} onBack={onBack} isAdmin={isAdmin} onEditCover={coverPicker.openPicker} />
            <input {...coverPicker.inputProps} />
            <ModalsContainer state={handlers.state} data={data} handlers={handlers} societyId={societyId} />
        </>
    );
}

function useCoverImagePicker(onSelect) {
    const fileRef = useRef(null);
    const onChange = (event) => readImageFile(event.target.files?.[0], onSelect, () => resetFileInput(fileRef));
    return {
        openPicker: () => fileRef.current?.click(),
        inputProps: { ref: fileRef, type: "file", accept: "image/*", onChange, hidden: true, "data-testid": "cover-image-input" },
    };
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
        <Tooltip content={title} position="top">
            <button className={`${styles.settingsBtn} ${styles.reportBtn} ${hasReported ? styles.reportedBtn : ""}`} onClick={hasReported ? onUnreport : onReport} aria-label={title} title={title} type="button">
                <Flag className={styles.reportBtnIcon} size={24} fill={hasReported ? "currentColor" : "none"} strokeWidth={hasReported ? 1 : 2} />
            </button>
        </Tooltip>
    );
}

function HeroActionButtons({ isAdmin, onSettings, onReport, onUnreport, hasReported }) {
    return (
        <div className={styles.heroActions}>
            <ReportButton hasReported={hasReported} onReport={onReport} onUnreport={onUnreport} />
            {isAdmin && <SettingsButton onSettings={onSettings} />}
        </div>
    );
}

function SettingsButton({ onSettings }) {
    return (
        <Tooltip content="Settings" position="top">
            <button className={styles.settingsBtn} onClick={onSettings} title="Settings" type="button" aria-label="Settings">
                <Settings size={24} strokeWidth={2} />
            </button>
        </Tooltip>
    );
}

/** Common header for the detail view including navigation. */

function TopBar({ onBack, societyName }) {
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
