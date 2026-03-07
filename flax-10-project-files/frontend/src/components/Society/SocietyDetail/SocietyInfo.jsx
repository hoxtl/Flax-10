import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import styles from "./SocietyInfo.module.css";
import CategorySelector, { CategoryDisplay } from "../CategorySelector";

export default function SocietyInfo({ society, editMode, onUpdateSociety, onJoin, onLeave, canEdit, onToggleEditMode, onViewMembers, isSubscribed, onToggleSubscription }) {
    const categories = society.categories || (society.category ? [society.category] : []);
    return (
        <div className={styles.info}>
            <BioSection text={society.bio} editMode={editMode} onSave={(bio) => onUpdateSociety?.({ bio })} />
            <CategorySection categories={categories} editMode={editMode} onSave={(cats) => onUpdateSociety?.({ categories: cats })} />
            <Stats society={society} onViewMembers={onViewMembers}
                isSubscribed={isSubscribed} onToggleSubscription={onToggleSubscription} />
            <ActionButton isMember={society.is_member} editMode={editMode} canEdit={canEdit}
                onJoin={onJoin} onLeave={onLeave} onToggleEditMode={onToggleEditMode} />
        </div>
    );
}

function BioSection({ text, editMode, onSave }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(text || "");
    useEffect(() => setValue(text || ""), [text]);

    if (editing) return <BioEditor value={value} setValue={setValue} onSave={() => { onSave(value); setEditing(false); }} />;
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

function BioEditor({ value, setValue, onSave }) {
    return (
        <div className={styles.bioEditor}>
            <textarea className={styles.bioInput} value={value} onChange={(e) => setValue(e.target.value)}
                placeholder="Describe your society..." rows={2} autoFocus />
            <button className={styles.saveBtn} onClick={onSave}>Save</button>
        </div>
    );
}

function CategorySection({ categories, editMode, onSave }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(categories || []);
    useEffect(() => setValue(categories || []), [categories]);

    if (editing) return <CategoryEditor value={value} setValue={setValue} onSave={() => { onSave(value); setEditing(false); }} />;
    return <CategoryDisplay category={categories} editMode={editMode} onEdit={() => setEditing(true)} />;
}

function CategoryEditor({ value, setValue, onSave }) {
    return (
        <div className={styles.categoryEditor}>
            <CategorySelector value={value} onChange={setValue} label="" multiple />
            <button className={styles.saveBtn} onClick={onSave}>Save</button>
        </div>
    );
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
            {society.is_ratified && <span className={styles.badge}>Ratified</span>}
        </div>
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
    return <button className={className} onClick={onToggle}>{label}</button>;
}

function MemberButton({ isMember, onJoin, onLeave }) {
    const handleClick = () => isMember ? onLeave?.() : onJoin?.();
    const className = isMember ? styles.joinedBtn : styles.joinBtn;
    const label = isMember ? "Joined" : "Join Society";
    return <button className={className} onClick={handleClick}>{label}</button>;
}
