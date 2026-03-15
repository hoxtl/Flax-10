import { useState } from "react";
import styles from "./ImageManagerComponents.module.css";
import { ImageGrid, AddImageView } from "./ImageManagerComponents";
import StandardModal from "../../../common/StandardModal/StandardModal";

export default function CoverImageModal({ images, availablePhotos, onClose, onUpdate }) {
    const [view, setView] = useState("list");
    const handlers = getModalHandlers(images, onUpdate, setView);

    if (view === "add") {
        return <AddImageView onClose={() => setView("list")} onAdd={handlers.add} availablePhotos={availablePhotos} />;
    }

    return (
        <StandardModal
            title="Manage Cover Images"
            onClose={onClose}
            size="lg"
            modalClassName={styles.modalShellWide}
            contentClassName={styles.modalContent}
        >
            <p className={styles.hint}>First image is shown on society card. Click ★ to pin.</p>
            <ImageGrid images={images} onDelete={handlers.delete} onPin={handlers.pin} onAddClick={() => setView("add")} />
        </StandardModal>
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
