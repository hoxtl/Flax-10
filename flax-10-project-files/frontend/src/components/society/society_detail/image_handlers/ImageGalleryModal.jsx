/*
 * ImageGalleryModal renders the fullscreen carousel for society images.
 */

import { useRef } from "react";
import StandardModal from "../../../common/standard_modal/StandardModal";
import styles from "./ImageGalleryModal.module.css";
import { useCarouselNavigation, useCarouselGestures, useCarouselKeyboard } from "../../hooks/useCarouselNavigation";

export default function ImageGalleryModal({ images, onClose, initialIndex = 0 }) {
    const { overlayRef, index, prev, next } = useGalleryControls(images.length, initialIndex, onClose);
    if (!images.length) return null;
    return (
        <StandardModal onClose={onClose} hideHeader size="xl" modalClassName={styles.modal} backdropRef={overlayRef}>
            <ModalContent images={images} index={index} prev={prev} next={next} onClose={onClose} />
        </StandardModal>
    );
}

function useGalleryControls(length, initialIndex, onClose) {
    const overlayRef = useRef(null);
    const controls = useCarouselNavigation(length, initialIndex);
    useCarouselGestures(overlayRef, controls);
    useCarouselKeyboard(controls.prev, controls.next, onClose);
    return { overlayRef, ...controls };
}

function ModalContent({ images, index, prev, next, onClose }) {
    const stopProp = (e) => e.stopPropagation();

    return (
        <div className={styles.modal} onClick={stopProp}>
            <CloseButton onClose={onClose} />
            <ImageDisplay src={images[index]} />
            <Navigation images={images} index={index} prev={prev} next={next} />
        </div>
    );
}

function CloseButton({ onClose }) {
    return <button className={styles.closeBtn} onClick={onClose}>&times;</button>;
}

function ImageDisplay({ src }) {
    return <img className={styles.image} src={src} alt="Gallery" />;
}

function Navigation({ images, index, prev, next }) {
    if (images.length <= 1) return null;

    return (
        <div className={styles.nav}>
            <NavButton onClick={prev} label="&larr;" />
            <DotsDisplay images={images} index={index} />
            <NavButton onClick={next} label="&rarr;" />
        </div>
    );
}

function DotsDisplay({ images, index }) {
    return (
        <div className={styles.dots}>
            {images.map((_, i) => <Dot key={i} isActive={i === index} />)}
        </div>
    );
}

function NavButton({ onClick, label }) {
    return <button className={styles.navBtn} onClick={onClick} dangerouslySetInnerHTML={{ __html: label }} />;
}

function Dot({ isActive }) {
    return <span className={`${styles.dot} ${isActive ? styles.activeDot : ""}`} />;
}
