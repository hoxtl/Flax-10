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

/** Primary metadata and action row for the society detail page. */

export default function SocietyInfo({
    society,
    editMode,
    onUpdateSociety,
    onJoin,
    onLeave,
    canEdit,
    onToggleEditMode,
    isSubscribed,
    onToggleSubscription,
    showBio = true,
    showLocation = true,
    showMeta = true,
    layout = "default",
    className = "",
    membershipAction = null,
}) {
    const classNames = [styles.info, layout === "hero" ? styles.infoHero : "", className].filter(Boolean).join(" ");
    const hasLocation = showLocation && Boolean(society.location);
    const hasVisibleSections = showBio || hasLocation || showMeta;

    if (!hasVisibleSections) return null;

    return (
        <div className={classNames}>
            {showBio && <BioSection text={society.bio} editMode={editMode} onSave={(bio) => onUpdateSociety?.({ bio })} />}
            {hasLocation && <LocationRow location={society.location} />}
            {showMeta && (
                <SocietyMetaPill
                    society={society}
                    editMode={editMode}
                    onUpdateSociety={onUpdateSociety}
                    onJoin={onJoin}
                    onLeave={onLeave}
                    canEdit={canEdit}
                    onToggleEditMode={onToggleEditMode}
                    isSubscribed={isSubscribed}
                    onToggleSubscription={onToggleSubscription}
                    membershipAction={membershipAction}
                    heroVariant={layout === "hero"}
                />
            )}
        </div>
    );
}

export function SocietyMetaPill({
    society,
    editMode,
    onUpdateSociety,
    onJoin,
    onLeave,
    canEdit,
    onToggleEditMode,
    isSubscribed,
    onToggleSubscription,
    membershipAction = null,
    heroVariant = false,
}) {
    const categories = society.categories || (society.category ? [society.category] : []);
    return (
        <motion.div layout className={styles.metaPillWrap}>
            <SegmentedSlots className={`${styles.metaPill} ${heroVariant ? styles.metaPillHero : ""}`}>
                <SegmentedSlot className={styles.categorySlot}>
                    <CategorySection categories={categories} editMode={editMode} onSave={(cats) => onUpdateSociety?.({ categories: cats })} />
                </SegmentedSlot>
                <SegmentedDivider className={styles.pillSep} />
                <SegmentedSlot className={styles.notificationSegment}>
                    <NotificationBell
                        isSubscribed={isSubscribed}
                        onToggle={onToggleSubscription}
                        disabled={!society.is_member}
                    />
                </SegmentedSlot>
                <SegmentedDivider className={styles.pillSep} />
                <SegmentedSlot className={styles.actionSegment}>
                    <PillActionButton
                        isMember={society.is_member}
                        editMode={editMode}
                        canEdit={canEdit}
                        onJoin={onJoin}
                        onLeave={onLeave}
                        onToggleEditMode={onToggleEditMode}
                        pendingAction={membershipAction}
                    />
                </SegmentedSlot>
            </SegmentedSlots>
        </motion.div>
    );
}

function LocationRow({ location }) {
    return (
        <LocationLink
            location={location}
            className={styles.locationRow}
            iconClassName={styles.locationIcon}
            textClassName={styles.locationText}
            iconSize={13}
        />
    );
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
            <textarea className={styles.bioInput} value={value} onChange={(e) => setValue(e.target.value)}
                placeholder="Describe your society..." rows={2} autoFocus />
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
                <div className={styles.categoryEditorActions}>
                    <PrimaryButton className={styles.categoryCancelBtn} variant="ghost" pill onClick={onClose}>Cancel</PrimaryButton>
                    <PrimaryButton className={styles.saveBtn} pill onClick={() => onSave(value)}>Save</PrimaryButton>
                </div>
            </div>
        </StandardModal>
    );
}

function saveAndClose(value, onSave, setEditing) {
    onSave(value);
    setEditing(false);
}

function EditIcon({ onClick }) {
    return <button type="button" className={styles.editIcon} onClick={onClick} title="Edit">✎</button>;
}

function NotificationBell({ isSubscribed, onToggle, disabled = false }) {
    const Icon = disabled ? BellOff : isSubscribed ? Bell : BellOff;
    const title = disabled ? "Join to manage notifications" : isSubscribed ? "Notifications on" : "Notifications off";
    const className = disabled ? styles.bellDisabled : isSubscribed ? styles.bellActive : styles.bellInactive;
    const button = (
        <button
            type="button"
            className={`${styles.notificationBell} ${className}`}
            onClick={onToggle}
            title={title}
            aria-label={title}
            disabled={disabled}
        >
            <AnimatePresence initial={false} mode="wait">
                <motion.span
                    key={title}
                    initial={{ opacity: 0.68, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.68, scale: 0.88 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className={styles.notificationBellIcon}
                >
                    <Icon size={18} />
                </motion.span>
            </AnimatePresence>
        </button>
    );

    return <Tooltip content={title} position="top">{button}</Tooltip>;
}

function PillActionButton({ isMember, editMode, canEdit, onJoin, onLeave, onToggleEditMode, pendingAction }) {
    if (canEdit) {
        const label = editMode ? "Done Editing" : "Edit Society";
        const adminClassName = editMode ? `${styles.pillActionBtn} ${styles.pillActionBtnEditing}` : styles.pillActionBtn;
        return <button type="button" className={adminClassName} onClick={onToggleEditMode}>{label}</button>;
    }
    const handleClick = () => {
        if (pendingAction) return;
        isMember ? onLeave?.() : onJoin?.();
    };
    const label = pendingAction === "join"
        ? "Joining..."
        : pendingAction === "leave"
            ? "Leaving..."
            : isMember
                ? "Leave"
                : "Join";
    return (
        <button
            type="button"
            className={`${styles.pillActionBtn} ${!isMember ? styles.pillActionBtnJoin : ''} ${pendingAction ? styles.pillActionBtnPending : ''}`}
            onClick={handleClick}
            disabled={Boolean(pendingAction)}
        >
            {isMember && !pendingAction && <Check size={14} strokeWidth={2.6} aria-hidden="true" />}
            <span>{label}</span>
        </button>
    );
}
