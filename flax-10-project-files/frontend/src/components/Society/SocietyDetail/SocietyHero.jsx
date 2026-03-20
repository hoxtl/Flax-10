/**
 * SocietyHero renders the visual header of the society detail page,
 * featuring an image carousel and an editable society name.
 */
import { useState, useRef, useMemo } from "react";
import styles from "./SocietyHero.module.css";
import { useCarouselNavigation, useCarouselGestures } from "../hooks/useCarouselNavigation";

/** Visual header carousel for the society detail page. */
export default function SocietyHero({ society, onImageClick, editMode, onEditImages, onUpdateName }) {
    const heroRef = useRef(null);
    const images = useMemo(() => getImages(society), [society]);
    const { index, prev, next } = useCarouselNavigation(images.length);
    const [hovered, setHovered] = useState(false);

    useCarouselGestures(heroRef, { prev, next });

    return (
        <div className={styles.hero} style={{ backgroundImage: `url("${images[index] || images[0]}")` }}
            ref={heroRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onClick={!editMode ? onImageClick : undefined}>
            <div className={styles.overlay}>
                {hovered && <HeroControls editMode={editMode} images={images}
                    prev={prev} next={next} onEditImages={onEditImages} />}
                <HeroContent society={society} imageCount={images.length} editMode={editMode} onUpdateName={onUpdateName} />
            </div>
        </div>
    );
}

/** Handles rendering of contextual controls (arrows or edit layer). */
function HeroControls({ editMode, images, prev, next, onEditImages }) {
    if (editMode) return <EditLayer onClick={onEditImages} />;
    return <HeroArrows total={images.length} prev={prev} next={next} />;
}

function getImages(society) {
    const rawUrls = (society.images || []).map(i => i.url || i);
    const unique = new Set(rawUrls.map(u => u.trim()));

    if (society.image) {
        unique.add(society.image.trim());
    }

    return Array.from(unique);
}

function HeroArrows({ total, prev, next }) {
    if (total <= 1) return null;
    const stop = (e, fn) => { e.stopPropagation(); fn(); };
    return (
        <>
            <button className={`${styles.arrowBtn} ${styles.leftArrow}`} onClick={(e) => stop(e, prev)}>
                <Chevron dir="left" />
            </button>
            <button className={`${styles.arrowBtn} ${styles.rightArrow}`} onClick={(e) => stop(e, next)}>
                <Chevron dir="right" />
            </button>
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

/** Renders a name that becomes an input field in edit mode. */
export function EditableName({ name, editMode, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [val, setVal] = useState(name);

    if (isEditing) return <NameInput val={val} setVal={setVal} onUpdate={onUpdate} setEditing={setIsEditing} />;

    return (
        <div className={styles.nameWrapper}
            onClick={(e) => { if (editMode) { e.stopPropagation(); setIsEditing(true); } }}>
            <h1 className={styles.name}>{name}</h1>
            {editMode && <span className={styles.editIcon}>✎</span>}
        </div>
    );
}

/** Inline text input for editing society names. */
function NameInput({ val, setVal, onUpdate, setEditing }) {
    const handleClose = () => { setEditing(false); onUpdate?.(val); };
    return <input className={styles.nameInput} value={val} autoFocus
        onChange={e => setVal(e.target.value)}
        onBlur={handleClose}
        onKeyDown={e => e.key === 'Enter' && handleClose()} />;
}

function ImageCounter({ count }) {
    if (count <= 1) return null;
    return <span className={styles.imageCount}>{count} photos</span>;
}
