/*
 * CoverImageModal manages a single society cover image with an explicit save flow.
 */

import { useEffect, useRef, useState } from "react";
import StandardModal from "../../../common/standard_modal/StandardModal";
import PrimaryButton from "../../../common/primary_button/PrimaryButton";
import styles from "./ImageManagerComponents.module.css";

function readSelectedImage(file, onLoad) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onLoad(event.target?.result || "");
    reader.readAsDataURL(file);
}

export default function CoverImageModal({ images = [], onClose, onUpdate }) {
    const fileRef = useRef(null);
    const [draftImage, setDraftImage] = useState(images[0] || "");

    useEffect(() => {
        setDraftImage(images[0] || "");
    }, [images]);

    const handleSave = () => {
        onUpdate?.(draftImage ? [draftImage] : []);
        onClose?.();
    };

    return (
        <StandardModal
            title="Edit Cover Image"
            subtitle="Use one image for the society card and banner."
            onClose={onClose}
            size="md"
            modalClassName={styles.modalShellWide}
            contentClassName={styles.modalContent}
        >
            <div className={styles.singleCoverBody}>
                <button
                    type="button"
                    className={`${styles.coverPreview} ${draftImage ? styles.coverPreviewFilled : ""}`}
                    onClick={() => fileRef.current?.click()}
                >
                    {draftImage ? <img src={draftImage} alt="Cover preview" className={styles.coverPreviewImage} /> : <span className={styles.coverPreviewLabel}>Upload cover image</span>}
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => readSelectedImage(event.target.files?.[0], setDraftImage)}
                />
                <div className={styles.singleCoverActions}>
                    <PrimaryButton type="button" variant="secondary" pill onClick={() => fileRef.current?.click()}>
                        {draftImage ? "Replace Image" : "Choose Image"}
                    </PrimaryButton>
                    <PrimaryButton type="button" variant="ghost" pill onClick={() => setDraftImage("")} disabled={!draftImage}>
                        Remove
                    </PrimaryButton>
                </div>
                <div className={styles.singleCoverFooter}>
                    <PrimaryButton type="button" variant="ghost" pill onClick={onClose}>Cancel</PrimaryButton>
                    <PrimaryButton type="button" pill onClick={handleSave}>Done</PrimaryButton>
                </div>
            </div>
        </StandardModal>
    );
}
