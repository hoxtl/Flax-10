import { useState, useRef } from "react";
import styles from "./CoverImageModal.module.css";

export default function CoverImageModal({ images, availablePhotos, onClose, onUpdate }) {
    const [view, setView] = useState("list");

    const handleAdd = (img) => {
        if (images.length >= 5) {
            alert("Maximum of 5 images allowed per society.");
            return;
        }
        onUpdate([...images, img]);
        setView("list");
    };
    <button
        className={styles.addCard}
        onClick={images.length < 5 ? onAddClick : () => alert("Maximum of 5 images reached")}
        disabled={images.length >= 5}
        title={images.length >= 5 ? "Maximum 5 images reached" : "Add image"}
        style={images.length >= 5 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
    >
        <span className={styles.addIcon}>+</span>
    </button>
    const handleDelete = (index) => onUpdate(images.filter((_, i) => i !== index));
    const handlePin = (index) => onUpdate([images[index], ...images.filter((_, i) => i !== index)]);

    if (view === "add") return <AddCoverView onClose={() => setView("list")} onAdd={handleAdd} availablePhotos={availablePhotos} />;

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <Header title="Manage Cover Images" onClose={onClose} />
                <p className={styles.hint}>First image is shown on society card. Click ★ to pin.</p>
                <ImageGrid images={images} onDelete={handleDelete} onPin={handlePin} onAddClick={() => setView("add")} />
            </div>
        </div>
    );
}

function ImageGrid({ images, onDelete, onPin, onAddClick }) {
    return (
        <div className={styles.grid}>
            {images.map((img, i) => <ImageCard key={i} src={img} index={i} onDelete={() => onDelete(i)} onPin={() => onPin(i)} />)}
            <button className={styles.addCard} onClick={onAddClick}><span className={styles.addIcon}>+</span></button>
        </div>
    );
}

function ImageCard({ src, index, onDelete, onPin }) {
    return (
        <div className={`${styles.imageCard} ${index === 0 ? styles.pinned : ""}`} style={{ backgroundImage: `url(${src})` }}>
            {index === 0 && <span className={styles.pinnedBadge}>★ Main</span>}
            {index !== 0 && <button className={styles.pinBtn} onClick={onPin} title="Set as main">★</button>}
            <button className={styles.deleteBtn} onClick={onDelete}>&times;</button>
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
