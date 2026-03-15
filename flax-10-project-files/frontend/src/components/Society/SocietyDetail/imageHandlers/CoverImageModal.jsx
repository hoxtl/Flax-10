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
import { ImageGrid, AddImageView } from "./ImageManagerComponents";
import StandardModal from "../../../common/StandardModal/StandardModal";

const HintText = () => <p className={styles.hint}>First image is shown on society card. Click ★ to pin.</p>;

export default function CoverImageModal({ images, availablePhotos, onClose, onUpdate }) {
    const [view, setView] = useState("list");
    const handlers = getModalHandlers(images, onUpdate, setView);

    if (view === "add") return <AddImageView onClose={() => setView("list")} onAdd={handlers.add} availablePhotos={availablePhotos} />;

    return (
        <StandardModal title="Manage Cover Images" onClose={onClose} size="lg" modalClassName={styles.modalShellWide}
            contentClassName={styles.modalContent}>
            <HintText />
            <ImageGrid images={images} onDelete={handlers.delete} onPin={handlers.pin} onAddClick={() => setView("add")} />
        </StandardModal>
    );
}

function getModalHandlers(images, onUpdate, setView) {
    return {
        add: (img) => { onUpdate([...images, img]); setView("list"); },
        delete: (index) => onUpdate(images.filter((_, i) => i !== index)),
        pin: (index) => onUpdate([images[index], ...images.filter((_, i) => i !== index)])
    };
}
