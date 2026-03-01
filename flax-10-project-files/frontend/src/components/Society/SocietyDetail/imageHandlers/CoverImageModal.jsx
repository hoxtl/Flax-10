import { useState } from "react";
import styles from "./ImageManagerComponents.module.css";
import { ImageHeader, ImageGrid, AddImageView } from "./ImageManagerComponents";

export default function CoverImageModal({ images, availablePhotos, onClose, onUpdate }) {
    const [view, setView] = useState("list");
    const handlers = getModalHandlers(images, onUpdate, setView);

    if (view === "add") {
        return <AddImageView onClose={() => setView("list")} onAdd={handlers.add} availablePhotos={availablePhotos} />;
    }

    return (
        <div className={styles.backdrop} onMouseDown={onClose}>
            <div className={styles.modal} onMouseDown={e => e.stopPropagation()}>
                <ImageHeader title="Manage Cover Images" onClose={onClose} />
                <p className={styles.hint}>First image is shown on society card. Click ★ to pin.</p>
                <ImageGrid images={images} onDelete={handlers.delete} onPin={handlers.pin} onAddClick={() => setView("add")} />
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
