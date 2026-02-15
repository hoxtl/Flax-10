import { useState } from "react";
import styles from "./SocietyHero.module.css";

export default function SocietyHero({ society, details, onImageClick, editMode, onEditImages, onUpdateName }) {
    const [hovered, setHovered] = useState(false);
    const [idx, setIdx] = useState(0);
    const images = details.images?.length > 0 ? details.images : [society.image];
    const currentImage = images[idx] || images[0];

    return (
        <div className={styles.hero} style={{ backgroundImage: `url(${currentImage})` }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onClick={!editMode ? onImageClick : undefined}>
            <div className={styles.overlay}>
                {!editMode && hovered && <HeroArrows idx={idx} total={images.length} setIdx={setIdx} />}
                {editMode && hovered && <EditLayer onClick={onEditImages} />}
                <HeroContent society={society} imageCount={images.length} editMode={editMode} onUpdateName={onUpdateName} />
            </div>
        </div>
    );
}

function HeroArrows({ idx, total, setIdx }) {
    const stopOption = (e, fn) => { e.stopPropagation(); fn(); };
    if (total <= 1) return null;
    return (
        <>
            {idx > 0 && <button className={`${styles.arrowBtn} ${styles.leftArrow}`} onClick={(e) => stopOption(e, () => setIdx(idx - 1))}><Chevron dir="left" /></button>}
            {idx < total - 1 && <button className={`${styles.arrowBtn} ${styles.rightArrow}`} onClick={(e) => stopOption(e, () => setIdx(idx + 1))}><Chevron dir="right" /></button>}
        </>
    );
}

function Chevron({ dir }) {
    const isRight = dir === 'right';
    return (
        <svg viewBox="0 0 18 42" width="18" height="42" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d={isRight ? "M 3 3 L 15 21 L 3 39" : "M 15 3 L 3 21 L 15 39"} />
        </svg>
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
