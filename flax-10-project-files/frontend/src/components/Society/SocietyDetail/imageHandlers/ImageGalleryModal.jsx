import React, { useRef } from "react";
import StandardModal from "../../../common/StandardModal/StandardModal";
import styles from "./ImageGalleryModal.module.css";
import { useCarouselNavigation, useCarouselGestures, useCarouselKeyboard } from "../../hooks/useCarouselNavigation";

export default function ImageGalleryModal({ images, onClose, initialIndex = 0 }) {
    const overlayRef = useRef(null);
    const { index, prev, next } = useCarouselNavigation(images.length, initialIndex);

    useCarouselGestures(overlayRef, { prev, next });
    useCarouselKeyboard(prev, next, onClose);

    if (!images.length) return null;

    return (
        <StandardModal
            onClose={onClose}
            hideHeader
            size="xl"
            modalClassName={styles.modal}
            backdropRef={overlayRef}
        >
            <ModalContent images={images} index={index} prev={prev} next={next} onClose={onClose} />
        </StandardModal>
    );
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
