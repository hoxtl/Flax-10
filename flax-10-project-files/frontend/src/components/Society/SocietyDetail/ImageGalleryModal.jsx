import { useState } from "react";
import styles from "./ImageGalleryModal.module.css";

export default function ImageGalleryModal({ images, onClose }) {
    const [index, setIndex] = useState(0);
    if (!images.length) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <ModalContent images={images} index={index} setIndex={setIndex} onClose={onClose} />
        </div>
    );
}

function ModalContent({ images, index, setIndex, onClose }) {
    const stopProp = (e) => e.stopPropagation();

    return (
        <div className={styles.modal} onClick={stopProp}>
            <CloseButton onClose={onClose} />
            <ImageDisplay src={images[index]} />
            <Navigation images={images} index={index} setIndex={setIndex} />
        </div>
    );
}

function CloseButton({ onClose }) {
    return <button className={styles.closeBtn} onClick={onClose}>&times;</button>;
}

function ImageDisplay({ src }) {
    return <img className={styles.image} src={src} alt="Gallery" />;
}

function Navigation({ images, index, setIndex }) {
    if (images.length <= 1) return null;
    const prev = () => setIndex((index - 1 + images.length) % images.length);
    const next = () => setIndex((index + 1) % images.length);

    return (
        <div className={styles.nav}>
            <NavButton onClick={prev} label="&larr;" />
            <Dots images={images} index={index} setIndex={setIndex} />
            <NavButton onClick={next} label="&rarr;" />
        </div>
    );
}

function NavButton({ onClick, label }) {
    return <button className={styles.navBtn} onClick={onClick} dangerouslySetInnerHTML={{ __html: label }} />;
}

function Dots({ images, index, setIndex }) {
    return (
        <div className={styles.dots}>
            {images.map((_, i) => <Dot key={i} isActive={i === index} onClick={() => setIndex(i)} />)}
        </div>
    );
}

function Dot({ isActive, onClick }) {
    return <button className={`${styles.dot} ${isActive ? styles.activeDot : ""}`} onClick={onClick} />;
}
