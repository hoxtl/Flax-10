import { useState, useRef } from "react";
import styles from "./CoverImageModal.module.css";

export default function CoverImageModal({ images, availablePhotos, onClose, onUpdate, onAdd }) {
    const [view, setView] = useState("list"); // list, add

    if (view === "add") {
        return <AddCoverView onClose={() => setView("list")} onAdd={(img) => { onAdd(img); setView("list"); }} availablePhotos={availablePhotos} />;
    }

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <Header title="Manage Cover Images" onClose={onClose} />
                <div className={styles.grid}>
                    {images.map((img, i) => (
                        <div key={i} className={styles.imageCard} style={{ backgroundImage: `url(${img})` }}>
                            <button className={styles.deleteBtn} onClick={() => onUpdate(images.filter((_, idx) => idx !== i))}>&times;</button>
                        </div>
                    ))}
                    <button className={styles.addCard} onClick={() => setView("add")}>
                        <span className={styles.addIcon}>+</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddCoverView({ onClose, onAdd, availablePhotos }) {
    const [tab, setTab] = useState("upload");
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const fileRef = useRef(null);

    const handleUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => onAdd(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <Header title="Add Cover Image" onClose={onClose} />
                <div className={styles.tabs}>
                    <button className={`${styles.tab} ${tab === "upload" ? styles.activeTab : ""}`} onClick={() => setTab("upload")}>Upload</button>
                    <button className={`${styles.tab} ${tab === "select" ? styles.activeTab : ""}`} onClick={() => setTab("select")}>From Photos</button>
                </div>

                {tab === "upload" ? (
                    <div className={styles.dropZone} onClick={() => fileRef.current?.click()}>
                        <input ref={fileRef} type="file" onChange={handleUpload} hidden />
                        <span>Click to upload image</span>
                    </div>
                ) : (
                    <div className={styles.photoSelectGrid}>
                        {availablePhotos.map((img, i) => (
                            <div key={i} className={`${styles.photoSelectCard} ${selectedPhoto === img ? styles.selected : ""}`}
                                style={{ backgroundImage: `url(${img})` }} onClick={() => setSelectedPhoto(img)} />
                        ))}
                    </div>
                )}

                {tab === "select" && (
                    <div className={styles.actions}>
                        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                        <button className={styles.confirmBtn} disabled={!selectedPhoto} onClick={() => onAdd(selectedPhoto)}>Add Selected</button>
                    </div>
                )}
            </div>
        </div>
    );
}

function Header({ title, onClose }) {
    return (
        <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            <button className={styles.close} onClick={onClose}>&times;</button>
        </div>
    );
}
