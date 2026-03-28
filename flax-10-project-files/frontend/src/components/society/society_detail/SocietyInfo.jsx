/*
 * SocietyInfo renders editable metadata and membership actions for a society.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, Check } from "lucide-react";
import PrimaryButton from "../../common/primary_button/PrimaryButton";
import LocationLink from "../../common/location_link/LocationLink";
import Tooltip from "../../common/tooltip/Tooltip";
import StandardModal from "../../common/standard_modal/StandardModal";
import { SegmentedDivider, SegmentedSlot, SegmentedSlots } from "../../common";
import styles from "./SocietyInfo.module.css";
import CategorySelector, { CategoryDisplay } from "../components/CategorySelector";

function getInfoConfig(society, layout, className, showBio, showLocation, showMeta) {
    const hasLocation = showLocation && Boolean(society.location);
    return {
        showBio,
        hasLocation,
        showMeta,
        hasVisibleSections: showBio || hasLocation || showMeta,
        className: [styles.info, layout === "hero" ? styles.infoHero : "", className].filter(Boolean).join(" "),
    };
}

/** Primary metadata and action row for the society detail page. */
export default function SocietyInfo(props) {
    const config = getInfoConfig(props.society, props.layout, props.className, props.showBio, props.showLocation, props.showMeta);
    if (!config.hasVisibleSections) return null;
    return <InfoSections {...props} config={config} />;
}

function InfoSections({ config, society, editMode, onUpdateSociety, onJoin, onLeave, canEdit, onToggleEditMode, isSubscribed, onToggleSubscription, membershipAction }) {
    return (
        <div className={config.className}>
            {config.showBio && <BioSection text={society.bio} editMode={editMode} onSave={(bio) => onUpdateSociety?.({ bio })} />}
            {config.hasLocation && <LocationRow location={society.location} />}
            {config.showMeta && <SocietyMetaPill society={society} editMode={editMode} onUpdateSociety={onUpdateSociety} onJoin={onJoin} onLeave={onLeave} canEdit={canEdit} onToggleEditMode={onToggleEditMode} isSubscribed={isSubscribed} onToggleSubscription={onToggleSubscription} membershipAction={membershipAction} heroVariant={config.className.includes(styles.infoHero)} />}
        </div>
    );
}

function getSocietyCategories(society) {
    return society.categories || (society.category ? [society.category] : []);
}

/** Groups category, notification, and membership actions inside a segmented pill. */
export function SocietyMetaPill(props) {
    const categories = getSocietyCategories(props.society);
    return <MetaPillLayout {...props} categories={categories} />;
}

function MetaPillLayout({ categories, society, editMode, onUpdateSociety, onJoin, onLeave, canEdit, onToggleEditMode, isSubscribed, onToggleSubscription, membershipAction, heroVariant = false }) {
    return (
        <motion.div layout className={styles.metaPillWrap}>
            <SegmentedSlots className={`${styles.metaPill} ${heroVariant ? styles.metaPillHero : ""}`}>
                <CategorySegment categories={categories} editMode={editMode} onSave={(value) => onUpdateSociety?.({ categories: value })} />
                <NotificationSegment isSubscribed={isSubscribed} onToggle={onToggleSubscription} disabled={!society.is_member} />
                <ActionSegment isMember={society.is_member} editMode={editMode} canEdit={canEdit} onJoin={onJoin} onLeave={onLeave} onToggleEditMode={onToggleEditMode} pendingAction={membershipAction} />
            </SegmentedSlots>
        </motion.div>
    );
}

function CategorySegment({ categories, editMode, onSave }) {
    return (
        <>
            <SegmentedSlot className={styles.categorySlot}>
                <CategorySection categories={categories} editMode={editMode} onSave={onSave} />
            </SegmentedSlot>
            <SegmentedDivider className={styles.pillSep} />
        </>
    );
}

function NotificationSegment({ isSubscribed, onToggle, disabled }) {
    return (
        <>
            <SegmentedSlot className={styles.notificationSegment}>
                <NotificationBell isSubscribed={isSubscribed} onToggle={onToggle} disabled={disabled} />
            </SegmentedSlot>
            <SegmentedDivider className={styles.pillSep} />
        </>
    );
}

function ActionSegment(props) {
    return (
        <SegmentedSlot className={styles.actionSegment}>
            <PillActionButton {...props} />
        </SegmentedSlot>
    );
}

function LocationRow({ location }) {
    return <LocationLink location={location} className={styles.locationRow} iconClassName={styles.locationIcon} textClassName={styles.locationText} iconSize={13} />;
}

function saveAndClose(value, onSave, setEditing) {
    onSave(value);
    setEditing(false);
}

/** Displays or edits the society biography. */
function BioSection({ text, editMode, onSave }) {
    const [editing, setEditing] = useState(false);
    if (editing) return <BioEditor initialValue={text || ""} onSave={(value) => saveAndClose(value, onSave, setEditing)} />;
    return <BioDisplay text={text} editMode={editMode} onEdit={() => setEditing(true)} />;
}

function BioDisplay({ text, editMode, onEdit }) {
    if (!text && !editMode) return <div className={styles.bioWrapper} />;
    const displayText = text || "Add a bio description...";
    const className = text ? styles.bio : styles.bioPlaceholder;
    return (
        <div className={styles.bioWrapper}>
            <p className={className}>
                {displayText}
                {editMode && <EditIcon onClick={onEdit} />}
            </p>
        </div>
    );
}

function BioEditor({ initialValue, onSave }) {
    const [value, setValue] = useState(initialValue);
    return (
        <div className={styles.bioEditor}>
            <textarea className={styles.bioInput} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Describe your society..." rows={2} autoFocus />
            <PrimaryButton className={styles.saveBtn} pill onClick={() => onSave(value)}>Save</PrimaryButton>
        </div>
    );
}

function CategorySection({ categories, editMode, onSave }) {
    const [editing, setEditing] = useState(false);
    return (
        <>
            <CategoryDisplay category={categories} editMode={editMode} onEdit={() => setEditing(true)} />
            {editing && <CategoryEditor initialValue={categories} onSave={(value) => saveAndClose(value, onSave, setEditing)} onClose={() => setEditing(false)} />}
        </>
    );
}

function CategoryEditor({ initialValue, onSave, onClose }) {
    const [value, setValue] = useState(initialValue);
    return (
        <StandardModal title="Edit Categories" subtitle="Choose how this society should be grouped." size="sm" onClose={onClose}>
            <div className={styles.categoryEditor}>
                <CategorySelector value={value} onChange={setValue} label="" multiple />
                <CategoryEditorActions onClose={onClose} onSave={() => onSave(value)} />
            </div>
        </StandardModal>
    );
}

function CategoryEditorActions({ onClose, onSave }) {
    return (
        <div className={styles.categoryEditorActions}>
            <PrimaryButton className={styles.categoryCancelBtn} variant="ghost" pill onClick={onClose}>Cancel</PrimaryButton>
            <PrimaryButton className={styles.saveBtn} pill onClick={onSave}>Save</PrimaryButton>
        </div>
    );
}

function EditIcon({ onClick }) {
    return <button type="button" className={styles.editIcon} onClick={onClick} title="Edit">✎</button>;
}

function getNotificationState(isSubscribed, disabled = false) {
    return {
        Icon: disabled || !isSubscribed ? BellOff : Bell,
        title: disabled ? "Join to manage notifications" : isSubscribed ? "Notifications on" : "Notifications off",
        className: disabled ? styles.bellDisabled : isSubscribed ? styles.bellActive : styles.bellInactive,
    };
}

function NotificationBell({ isSubscribed, onToggle, disabled = false }) {
    const state = getNotificationState(isSubscribed, disabled);
    return <Tooltip content={state.title} position="top"><NotificationButton state={state} onToggle={onToggle} disabled={disabled} /></Tooltip>;
}

function NotificationButton({ state, onToggle, disabled }) {
    return (
        <button type="button" className={`${styles.notificationBell} ${state.className}`} onClick={onToggle} title={state.title} aria-label={state.title} disabled={disabled}>
            <NotificationIcon title={state.title} Icon={state.Icon} />
        </button>
    );
}

function NotificationIcon({ title, Icon }) {
    return (
        <AnimatePresence initial={false} mode="wait">
            <motion.span key={title} initial={{ opacity: 0.68, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0.68, scale: 0.88 }} transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }} className={styles.notificationBellIcon}>
                <Icon size={18} />
            </motion.span>
        </AnimatePresence>
    );
}

function getPendingLabel(pendingAction, isMember) {
    if (pendingAction === "join") return "Joining...";
    if (pendingAction === "leave") return "Leaving...";
    return isMember ? "Leave" : "Join";
}

function PillActionButton(props) {
    if (props.canEdit) return <AdminActionButton editMode={props.editMode} onToggleEditMode={props.onToggleEditMode} />;
    return <MembershipActionButton {...props} />;
}

function AdminActionButton({ editMode, onToggleEditMode }) {
    const label = editMode ? "Done Editing" : "Edit Society";
    const className = editMode ? `${styles.pillActionBtn} ${styles.pillActionBtnEditing}` : styles.pillActionBtn;
    return <button type="button" className={className} onClick={onToggleEditMode}>{label}</button>;
}

function MembershipActionButton({ isMember, onJoin, onLeave, pendingAction }) {
    const handleClick = () => { if (!pendingAction) (isMember ? onLeave?.() : onJoin?.()); };
    const className = `${styles.pillActionBtn} ${!isMember ? styles.pillActionBtnJoin : ""} ${pendingAction ? styles.pillActionBtnPending : ""}`.trim();
    return <MembershipActionButtonView className={className} isMember={isMember} label={getPendingLabel(pendingAction, isMember)} pendingAction={pendingAction} onClick={handleClick} />;
}

function MembershipActionButtonView({ className, isMember, label, pendingAction, onClick }) {
    return (
        <button type="button" className={className} onClick={onClick} disabled={Boolean(pendingAction)}>
            {isMember && !pendingAction && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
            <span>{label}</span>
        </button>
    );
}
