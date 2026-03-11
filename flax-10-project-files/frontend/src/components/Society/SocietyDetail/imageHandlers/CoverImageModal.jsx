/**
 * CoverImageModal provides an interface for pinning, deleting, and adding cover photos.
 * Limits images to a maximum of 5.
 */
/**
 * ImageGalleryModal provides a fullscreen carousel for viewing society photos.
 * Supports keyboard and gesture navigation.
 */
import { useState, useRef } from "react";
import styles from "./ImageManagerComponents.module.css";
import { ImageHeader, ImageGrid, AddImageView } from "./ImageManagerComponents";

export default function CoverImageModal({ images, availablePhotos, onClose, onUpdate }) {
    const [view, setView] = useState("list");
    const hs = getModalHandlers(images, onUpdate, setView);

    if (view === "add") {
        return <AddImageView onClose={() => setView("list")} onAdd={hs.add}
            availablePhotos={availablePhotos} />;
    }

    return (
        <ImageModalBackdrop onClose={onClose}>
            <ImageHeader title="Manage Cover Images" onClose={onClose} />
            <p className={styles.hint}>First image is shown on society card. Click ★ to pin.</p>
            <ImageGrid images={images} onDelete={hs.delete} onPin={hs.pin} onAddClick={() => setView("add")} />
        </ImageModalBackdrop>
    );
}

function ImageModalBackdrop({ onClose, children }) {
    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );
}

function getModalHandlers(images, onUpdate, setView) {
    return {
        add: (img) => {
            if (images.length >= 5) return alert("Maximum 5 images reach.");
            onUpdate([...images, img]);
            setView("list");
        },
        delete: (index) => onUpdate(images.filter((_, i) => i !== index)),
        pin: (index) => onUpdate([images[index], ...images.filter((_, i) => i !== index)])
    };
}
