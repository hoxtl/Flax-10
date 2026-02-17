import { useState } from "react";
import styles from "./SocietyInfo.module.css";

export default function SocietyInfo({ society, editMode, onUpdateSociety, onJoin, onLeave, canEdit, onEnterEditMode }) {
    return (
        <div className={styles.info}>
            <BioSection text={society.bio} editMode={editMode} onSave={(bio) => onUpdateSociety?.({ bio })} />
            <Stats society={society} />
            <ActionButton isMember={society.is_member} editMode={editMode} canEdit={canEdit}
                onJoin={onJoin} onLeave={onLeave} onEnterEditMode={onEnterEditMode} />
        </div>
    );
}

function BioSection({ text, editMode, onSave }) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(text || "");

    if (editing) return <BioEditor value={value} setValue={setValue} onSave={() => { onSave(value); setEditing(false); }} />;
    return <BioDisplay text={text} editMode={editMode} onEdit={() => setEditing(true)} />;
}

function BioDisplay({ text, editMode, onEdit }) {
    if (!text && !editMode) return null;
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

function EditIcon({ onClick }) {
    return <button className={styles.editIcon} onClick={onClick} title="Edit">✎</button>;
}

function Stats({ society }) {
    return (
        <div className={styles.stats}>
            <span>{society.member_count} members</span>
            {society.is_ratified && <span className={styles.badge}>Ratified</span>}
            {society.date_created && <span>Est. {formatYear(society.date_created)}</span>}
        </div>
    );
}

function ActionButton({ isMember, editMode, canEdit, onJoin, onLeave, onEnterEditMode }) {
    if (editMode) return null;
    if (canEdit) return <button className={styles.joinBtn} onClick={onEnterEditMode}>Edit Society</button>;
    return <MemberButton isMember={isMember} onJoin={onJoin} onLeave={onLeave} />;
}

function MemberButton({ isMember, onJoin, onLeave }) {
    const handleClick = () => isMember ? onLeave?.() : onJoin?.();
    const className = isMember ? styles.joinedBtn : styles.joinBtn;
    const label = isMember ? "Joined" : "Join Society";
    return <button className={className} onClick={handleClick}>{label}</button>;
}

function formatYear(dateStr) {
    return new Date(dateStr).getFullYear();
}
