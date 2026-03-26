/**
 * ImageManagerComponents provides a suite of reusable UI elements for
 * managing society cover photos and gallery images.
 */

import { useRef } from "react";
import styles from "./ImageManagerComponents.module.css";

export function ImageHeader({ title, onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.close} onClick={onClose} type="button">&times;</button>
        </div>
    );
}

export function ImageGrid({ images, onDelete, onPin, onAdd }) {
    const isFull = images.length >= 5;
    return (
        <div className={styles.grid}>
            {images.map((img, i) => (
                <ImageCard key={i} src={img} index={i} onDelete={() => onDelete(i)} onPin={() => onPin(i)} />
            ))}
            <AddButton onUpload={onAdd} disabled={isFull} />
        </div>
    );
}

function AddButton({ onUpload, disabled }) {
    const fileRef = useRef(null);
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => onUpload(ev.target.result);
        reader.readAsDataURL(file);
    };

    return (
        <button className={styles.addCard} onClick={() => fileRef.current?.click()} disabled={disabled}
            title={disabled ? "Maximum 5 images reached" : "Add image"} style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
            <input ref={fileRef} type="file" onChange={handleFile} accept="image/*" hidden />
            <span className={styles.addIcon}>+</span>
        </button>
    );
}

export function ImageCard({ src, index, onDelete, onPin }) {
    return (
        <div className={`${styles.imageCard} ${index === 0 ? styles.pinned : ""}`} style={{ backgroundImage: `url("${src}")` }}>
            {index === 0 && <span className={styles.pinnedBadge}>★ Main</span>}
            {index !== 0 && <button className={styles.pinBtn} onClick={onPin} title="Set as main" type="button">★</button>}
            <button className={styles.deleteBtn} onClick={onDelete} type="button">&times;</button>
        </div>
    );
}
