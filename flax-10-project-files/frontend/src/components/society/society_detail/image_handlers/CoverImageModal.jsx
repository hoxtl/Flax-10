/*
 * CoverImageModal manages society cover images where the first image is the
 * primary cover shown across the society surfaces.
 */

import { useEffect, useState } from "react";
import StandardModal from "../../../common/standard_modal/StandardModal";
import { ImageGrid, ImageHeader } from "./ImageManagerComponents";
import styles from "./ImageManagerComponents.module.css";

function buildPinnedImages(images, index) {
    if (index <= 0 || index >= images.length) return images;
    const nextImages = [...images];
    const [selected] = nextImages.splice(index, 1);
    nextImages.unshift(selected);
    return nextImages;
}

function buildImagesWithoutIndex(images, index) {
    return images.filter((_, currentIndex) => currentIndex !== index);
}

function buildImagesWithUpload(images, uploadedImage) {
    return [...images, uploadedImage].slice(0, 5);
}

export default function CoverImageModal({ images = [], availablePhotos = [], onClose, onUpdate }) {
    const [draftImages, setDraftImages] = useState(images);

    useEffect(() => {
        setDraftImages(images);
    }, [images]);

    const updateImages = (nextImages) => {
        setDraftImages(nextImages);
        onUpdate?.(nextImages);
    };

    return (
        <StandardModal
            hideHeader
            onClose={onClose}
            size="md"
            modalClassName={styles.modal}
        >
            <ImageHeader title="Manage Cover Images" onClose={onClose} />
            <p className={styles.hint}>First image is shown on society card and banner. Up to 5 images.</p>
            <ImageGrid
                images={draftImages}
                availablePhotos={availablePhotos}
                onPin={(index) => updateImages(buildPinnedImages(draftImages, index))}
                onDelete={(index) => updateImages(buildImagesWithoutIndex(draftImages, index))}
                onAdd={(uploadedImage) => updateImages(buildImagesWithUpload(draftImages, uploadedImage))}
            />
        </StandardModal>
    );
}
