/*
 * SocietyInfo renders editable metadata and membership actions for a society.
 */

import { useState } from "react";
import { Bell, BellOff, MapPin } from "lucide-react";
import Badge from "../../common/Badge/Badge";
import PrimaryButton from "../../common/PrimaryButton/PrimaryButton";
import SocietyInsightBanner from "./SocietyInsightBanner.jsx";
import styles from "./SocietyInfo.module.css";
import CategorySelector, { CategoryDisplay } from "../CategorySelector";

/** Primary metadata and action row for the society detail page. */

export default function SocietyInfo({ society, editMode, onUpdateSociety, onJoin, onLeave, canEdit, onToggleEditMode, onViewMembers, isSubscribed, onToggleSubscription }) {
    const categories = society.categories || (society.category ? [society.category] : []);
    return (
        <div className={styles.info}>
            <BioSection text={society.bio} editMode={editMode} onSave={(bio) => onUpdateSociety?.({ bio })} />
            <CategorySection categories={categories} editMode={editMode} onSave={(cats) => onUpdateSociety?.({ categories: cats })} />
            {society.location && <LocationRow location={society.location} />}
            <Stats society={society} onViewMembers={onViewMembers}
                isSubscribed={isSubscribed} onToggleSubscription={onToggleSubscription} />
            {!canEdit && !society.is_admin && <SocietyInsightBanner society={society} />}
            <ActionButton isMember={society.is_member} editMode={editMode} canEdit={canEdit}
                onJoin={onJoin} onLeave={onLeave} onToggleEditMode={onToggleEditMode} />
        </div>
    );
}

function LocationRow({ location }) {
    return (
        <div className={styles.locationRow}>
            <MapPin size={13} className={styles.locationIcon} aria-hidden="true" />
            <span className={styles.locationText}>{location}</span>
        </div>
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
    if (editing) return <CategoryEditor initialValue={categories} onSave={(value) => saveAndClose(value, onSave, setEditing)} />;
    return <CategoryDisplay category={categories} editMode={editMode} onEdit={() => setEditing(true)} />;
}

function CategoryEditor({ initialValue, onSave }) {
    const [value, setValue] = useState(initialValue);
    return (
        <div className={styles.categoryEditor}>
            <CategorySelector value={value} onChange={setValue} label="" multiple />
            <PrimaryButton className={styles.saveBtn} pill onClick={() => onSave(value)}>Save</PrimaryButton>
        </div>
    );
}

function saveAndClose(value, onSave, setEditing) {
    onSave(value);
    setEditing(false);
}

function EditIcon({ onClick }) {
    return <button className={styles.editIcon} onClick={onClick} title="Edit">✎</button>;
}

function Stats({ society, onViewMembers, isSubscribed, onToggleSubscription }) {
    return (
        <div className={styles.stats}>
            {society.is_member && (
                <NotificationBell isSubscribed={isSubscribed} onToggle={onToggleSubscription} />
            )}
            <button className={styles.memberCountBtn} onClick={onViewMembers} title="View Members">
                {society.member_count} members
            </button>
            {society.is_ratified && (
                <Badge className={styles.badge} tone="success">
                    <VerifiedIcon />
                    Ratified
                </Badge>
            )}
        </div>
    );
}

function VerifiedIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={styles.verifiedIcon}
            aria-hidden="true"
        >
            <path
                fill="currentColor"
                d="m10.9246 13.175 -1.825 -1.9c-0.15 -0.16665 -0.3333 -0.25 -0.55 -0.25 -0.21665 0 -0.4083 0.075 -0.575 0.225 -0.16665 0.16665 -0.25 0.35835 -0.25 0.575 0 0.21665 0.08335 0.40835 0.25 0.575l2.425 2.4c0.15 0.15 0.325 0.225 0.525 0.225s0.375 -0.075 0.525 -0.225l4.575 -4.55c0.15 -0.15 0.225 -0.33335 0.225 -0.55 0 -0.21665 -0.0833 -0.4 -0.25 -0.55 -0.15 -0.13335 -0.32915 -0.19585 -0.5375 -0.1875 -0.2083 0.00835 -0.37915 0.07915 -0.5125 0.2125l-4.025 4Zm-2.625 8.725 -1.55 -2.65 -3.09999 -0.625c-0.183335 -0.03335 -0.3375 -0.13335 -0.4625 -0.3s-0.170835 -0.34165 -0.1375 -0.525l0.35 -3 -1.975 -2.3c-0.133335 -0.13335 -0.2 -0.3 -0.2 -0.5s0.066665 -0.36665 0.2 -0.5l1.975 -2.275 -0.35 -3c-0.033335 -0.18335 0.0125 -0.35835 0.1375 -0.525 0.125 -0.16665 0.279165 -0.26665 0.4625 -0.3l3.09999 -0.625 1.55 -2.675c0.1 -0.16667 0.2417 -0.283335 0.425 -0.35 0.18335 -0.06667 0.3667 -0.058335 0.55 0.025l2.725 1.275 2.725 -1.275c0.18335 -0.083335 0.3667 -0.095835 0.55 -0.0375 0.18335 0.05833 0.325 0.17083 0.425 0.3375l1.575 2.7 3.075 0.625c0.18335 0.03335 0.3375 0.13335 0.4625 0.3s0.17085 0.34165 0.1375 0.525l-0.35 3 1.975 2.275c0.13335 0.13335 0.2 0.3 0.2 0.5s-0.06665 0.36665 -0.2 0.5l-1.975 2.3 0.35 3c0.03335 0.18335 -0.0125 0.35835 -0.1375 0.525 -0.125 0.16665 -0.27915 0.26665 -0.4625 0.3l-3.075 0.625 -1.575 2.675c-0.1 0.16665 -0.24165 0.27915 -0.425 0.3375 -0.1833 0.05835 -0.36665 0.04585 -0.55 -0.0375l-2.725 -1.275 -2.725 1.275c-0.1833 0.08335 -0.36665 0.09165 -0.55 0.025 -0.1833 -0.06665 -0.325 -0.18335 -0.425 -0.35Zm1.025 -1.375 2.675 -1.125 2.75 1.125 1.675 -2.5 2.925 -0.75 -0.3 -2.975 2.025 -2.3 -2.025 -2.35 0.3 -2.975 -2.925 -0.7 -1.725 -2.5 -2.7 1.125 -2.75 -1.125 -1.675 2.5 -2.92499 0.7 0.3 2.975 -2.025 2.35 2.025 2.3 -0.3 3.025 2.92499 0.7 1.75 2.5Z"
            />
        </svg>
    );
}

function NotificationBell({ isSubscribed, onToggle }) {
    const Icon = isSubscribed ? Bell : BellOff;
    const title = isSubscribed ? "Notifications on" : "Notifications off";
    const className = isSubscribed ? styles.bellActive : styles.bellInactive;
    return (
        <button className={`${styles.notificationBell} ${className}`} onClick={onToggle} title={title}>
            <Icon size={18} />
        </button>
    );
}

function ActionButton({ isMember, editMode, canEdit, onJoin, onLeave, onToggleEditMode }) {
    if (canEdit) return <EditButton editMode={editMode} onToggle={onToggleEditMode} />;
    return <MemberButton isMember={isMember} onJoin={onJoin} onLeave={onLeave} />;
}

function EditButton({ editMode, onToggle }) {
    const className = editMode ? styles.joinedBtn : styles.joinBtn;
    const label = editMode ? "Exit Editor" : "Edit Society";
    const variant = editMode ? "secondary" : "primary";
    return <PrimaryButton className={className} variant={variant} pill onClick={onToggle}>{label}</PrimaryButton>;
}

function MemberButton({ isMember, onJoin, onLeave }) {
    const handleClick = () => isMember ? onLeave?.() : onJoin?.();
    const className = isMember ? styles.joinedBtn : styles.joinBtn;
    const label = isMember ? "Joined" : "Join Society";
    const variant = isMember ? "secondary" : "primary";
    return <PrimaryButton className={className} variant={variant} pill onClick={handleClick}>{label}</PrimaryButton>;
}
