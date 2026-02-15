import { useState } from "react";
import styles from "./SocietyInfo.module.css";

export default function SocietyInfo({ society, details, editMode, onUpdateSociety }) {
    return (
        <div className={styles.info}>
            <BioSection text={details.bio} editMode={editMode} onSave={(bio) => onUpdateSociety?.({ bio })} />
            <Stats society={society} details={details} />
            <JoinButton isMember={details.isMember} isPrivate={society.isPrivate} editMode={editMode} />
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

function Stats({ society, details }) {
    return (
        <div className={styles.stats}>
            <span>{society.memberCount} members</span>
            {society.isRatified && <span className={styles.badge}>Ratified</span>}
            {details.dateCreated && <span>Est. {formatYear(details.dateCreated)}</span>}
        </div>
    );
}

function JoinButton({ isMember, isPrivate, editMode }) {
    const [status, setStatus] = useState(isMember ? "joined" : "not_joined");
    const handleClick = () => handleJoinClick(status, isPrivate, setStatus);

    if (editMode) return null;

    return <button className={getButtonClass(status)} onClick={handleClick}>{getButtonLabel(status)}</button>;
}

function handleJoinClick(status, isPrivate, setStatus) {
    if (status === "joined") return setStatus("not_joined");
    if (status === "requested") return setStatus("not_joined");
    return setStatus(isPrivate ? "requested" : "joined");
}

function getButtonLabel(status) {
    if (status === "joined") return "Joined";
    if (status === "requested") return "Requested";
    return "Join Society";
}

function getButtonClass(status) {
    if (status === "joined") return styles.joinedBtn;
    if (status === "requested") return styles.requestedBtn;
    return styles.joinBtn;
}

function formatYear(dateStr) {
    return new Date(dateStr).getFullYear();
}
