/*
 * CoverImageModal manages reordering, deleting, and adding society images.
 */
import styles from "./ImageManagerComponents.module.css";
import { ImageGrid } from "./ImageManagerComponents";
import StandardModal from "../../../Common/StandardModal/StandardModal";

const HintText = () => <p className={styles.hint}>First image is shown on society card. Click ★ to pin.</p>;

export default function CoverImageModal({ images, onClose, onUpdate }) {
    const handlers = getModalHandlers(images, onUpdate);

    return (
        <StandardModal title="Manage Cover Images" onClose={onClose} size="lg" modalClassName={styles.modalShellWide}
            contentClassName={styles.modalContent}>
            <HintText />
            <ImageGrid images={images} onDelete={handlers.delete} onPin={handlers.pin} onAdd={handlers.add} />
        </StandardModal>
    );
}

function getModalHandlers(images, onUpdate) {
    return {
        add: (img) => onUpdate([...images, img]),
        delete: (index) => onUpdate(images.filter((_, i) => i !== index)),
        pin: (index) => onUpdate([images[index], ...images.filter((_, i) => i !== index)])
    };
}
