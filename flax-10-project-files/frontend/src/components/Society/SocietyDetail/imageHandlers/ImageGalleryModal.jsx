import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./ImageGalleryModal.module.css";

export default function ImageGalleryModal({ images, onClose, initialIndex = 0 }) {
    const [index, setIndex] = useState(initialIndex);
    const overlayRef = useRef(null);
    const { prev, next } = useNavActions(images.length, setIndex);
    useKeyboardNav(prev, next, onClose);
    useSwipeNav(overlayRef, prev, next);

    if (!images.length) return null;

    return (
        <div className={styles.overlay} onClick={onClose} ref={overlayRef}>
            <ModalContent images={images} index={index} prev={prev} next={next} onClose={onClose} />
        </div>
    );
}

function useNavActions(length, setIndex) {
    const prev = useCallback(() => setIndex(i => (i - 1 + length) % length), [length, setIndex]);
    const next = useCallback(() => setIndex(i => (i + 1) % length), [length, setIndex]);
    return { prev, next };
}

function useKeyboardNav(prev, next, onClose) {
    useEffect(() => {
        const handler = (e) => handleKeyDown(e, prev, next, onClose);
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [prev, next, onClose]);
}

function handleKeyDown(e, prev, next, onClose) {
    if (e.key === "ArrowLeft") prev();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "Escape") onClose();
}

function useSwipeNav(ref, prev, next) {
    useTouchSwipe(ref, prev, next);
    useWheelSwipe(ref, prev, next);
}

function useTouchSwipe(ref, prev, next) {
    const startX = useRef(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onStart = (e) => { startX.current = e.changedTouches?.[0]?.clientX ?? 0; };
        const onEnd = (e) => handleSwipe(e.changedTouches?.[0]?.clientX ?? 0, startX.current, prev, next);
        el.addEventListener("touchstart", onStart);
        el.addEventListener("touchend", onEnd);
        return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchend", onEnd); };
    }, [ref, prev, next]);
}

function useWheelSwipe(ref, prev, next) {
    const lastNav = useRef(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onWheel = (e) => handleWheelNav(e, prev, next, lastNav);
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [ref, prev, next]);
}

function handleSwipe(endX, startX, prev, next) {
    const diff = endX - startX;
    if (Math.abs(diff) < 50) return;
    if (diff > 0) prev();
    else next();
}

function handleWheelNav(e, prev, next, lastNav) {
    if (Math.abs(e.deltaX) < 10 || Date.now() - lastNav.current < 300) return;
    e.preventDefault();
    lastNav.current = Date.now();
    if (e.deltaX > 0) next();
    else prev();
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
