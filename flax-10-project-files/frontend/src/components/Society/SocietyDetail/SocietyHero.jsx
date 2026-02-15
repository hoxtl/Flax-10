import { useState } from "react";
import styles from "./SocietyHero.module.css";

export default function SocietyHero({ society, details, onImageClick, editMode, onEditImages, onUpdateName }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div className={styles.hero} style={{ backgroundImage: `url(${details.images?.[0] || society.image})` }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div className={styles.overlay}>
                {editMode && hovered && <EditLayer onClick={onEditImages} />}
                <HeroContent society={society} imageCount={details.images?.length || 1}
                    editMode={editMode} onUpdateName={onUpdateName} />
            </div>
        </div>
    );
}

function EditLayer({ onClick }) {
    return (
        <div className={styles.editLayer} onClick={onClick}>
            <span className={styles.editLabel}>Click to Edit Cover Images</span>
        </div>
    );
}

function HeroContent({ society, imageCount, editMode, onUpdateName }) {
    return (
        <div className={styles.content}>
            <EditableName name={society.name} editMode={editMode} onUpdate={onUpdateName} />
            <ImageCounter count={imageCount} />
        </div>
    );
}

function EditableName({ name, editMode, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(name);

    if (isEditing) {
        return <input className={styles.nameInput} value={val} autoFocus
            onChange={e => setVal(e.target.value)}
            onBlur={() => { setIsEditing(false); onUpdate?.(val); }}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()} />;
    }
    return (
        <div className={styles.nameWrapper}
            onClick={(e) => { if (editMode) { e.stopPropagation(); setIsEditing(true); } }}>
            <h1 className={styles.name}>{name}</h1>
            {editMode && <span className={styles.editIcon}>✎</span>}
        </div>
    );
}

function ImageCounter({ count }) {
    if (count <= 1) return null;
    return <span className={styles.imageCount}>{count} photos</span>;
}
