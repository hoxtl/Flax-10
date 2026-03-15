/**
 * ImageManagerComponents provides a suite of reusable UI elements for
 * managing society cover photos and gallery images.
 */
import { useState, useRef } from "react";
import StandardModal from "../../../common/StandardModal/StandardModal";
import styles from "./ImageManagerComponents.module.css";

export function ImageHeader({ title, onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.close} onClick={onClose} type="button">&times;</button>
        </div>
    );
}

export function ImageGrid({ images, onDelete, onPin, onAddClick }) {
    const isFull = images.length >= 5;
    return (
        <div className={styles.grid}>
            {images.map((img, i) => (
                <ImageCard key={i} src={img} index={i} onDelete={() => onDelete(i)} onPin={() => onPin(i)} />
            ))}
            <AddButton onClick={onAddClick} disabled={isFull} />
        </div>
    );
}

function AddButton({ onClick, disabled }) {
    return (
        <button className={styles.addCard} onClick={onClick} disabled={disabled}
            title={disabled ? "Maximum 5 images reached" : "Add image"}
            style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
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

/** Modal view for uploading a new image or selecting from existing photos. */
const PhotoSelect = ({ photos, selected, onSelect }) => (
    <div className={styles.photoSelectGrid}>
        {photos.map((img, i) => (
            <div key={i} className={`${styles.photoSelectCard} ${selected === img ? styles.selected : ""}`}
                style={{ backgroundImage: `url("${img}")` }} onClick={() => onSelect(img)} />
        ))}
    </div>
);

const UploadZone = ({ fileRef, onUpload }) => (
    <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" onChange={onUpload} hidden />
        <span>Click to upload image</span>
    </div>
);

function TabSelector({ active, onSelect, hasPhotos }) {
    if (!hasPhotos) return null;
    return (
        <div className={styles.tabSelector}>
            <button className={active === 'upload' ? styles.activeTab : ''} onClick={() => onSelect('upload')}>Upload</button>
            <button className={active === 'select' ? styles.activeTab : ''} onClick={() => onSelect('select')}>From Photos</button>
        </div>
    );
}

function performUpload(file, onAdd) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onAdd(e.target.result);
    reader.readAsDataURL(file);
}

export function AddImageView({ onClose, onAdd, availablePhotos = [] }) {
    const [tab, setTab] = useState("upload");
    const [selected, setSelected] = useState(null);
    const fileRef = useRef(null);

    return (
        <StandardModal title="Add Image" onClose={onClose} size="md" modalClassName={styles.modalShell}
            contentClassName={styles.modalContent}>
            <TabSelector active={tab} onSelect={setTab} hasPhotos={availablePhotos.length > 0} />
            {tab === "upload" ? <UploadZone fileRef={fileRef} onUpload={(e) => performUpload(e.target.files[0], onAdd)} /> :
                <PhotoSelect photos={availablePhotos} selected={selected} onSelect={setSelected} />}
            <FooterActions tab={tab} onClose={onClose} onAdd={() => onAdd(selected)} selected={selected} />
        </StandardModal>
    );
}

function FooterActions({ tab, onClose, onAdd, selected }) {
    if (tab !== "select") return null;
    return (
        <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={onClose} type="button">Cancel</button>
            <button className={styles.confirmBtn} disabled={!selected} onClick={onAdd} type="button">Add Selected</button>
        </div>
    );
}
