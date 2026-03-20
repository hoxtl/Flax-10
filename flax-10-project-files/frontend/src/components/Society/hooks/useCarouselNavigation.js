/*
 * useCarouselNavigation provides carousel state plus gesture and keyboard helpers.
 */
import { useState, useCallback, useEffect, useRef } from "react";

export function useCarouselNavigation(length, initialIndex = 0) {
    const [index, setIndex] = useState(initialIndex);
    const prev = useCallback(() => setIndex(i => (i - 1 + length) % length), [length]);
    const next = useCallback(() => setIndex(i => (i + 1) % length), [length]);
    return { index, setIndex, prev, next };
}

export function useCarouselGestures(ref, { prev, next }) {
    useTouchSwipe(ref, prev, next);
}

function useTouchSwipe(ref, prev, next) {
    const startX = useRef(0);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onStart = (e) => { startX.current = e.changedTouches?.[0]?.clientX ?? 0; };
        const onEnd = (e) => handleSwipe(e, startX.current, prev, next);
        el.addEventListener("touchstart", onStart);
        el.addEventListener("touchend", onEnd);
        return () => { el.removeEventListener("touchstart", onStart); el.removeEventListener("touchend", onEnd); };
    }, [ref, prev, next]);
}

function handleSwipe(e, startX, prev, next) {
    const endX = e.changedTouches?.[0]?.clientX ?? 0;
    const diff = endX - startX;
    if (Math.abs(diff) < 50) return;
    diff > 0 ? prev() : next();
}

export function useCarouselKeyboard(prev, next, onClose) {
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "ArrowLeft") prev();
            else if (e.key === "ArrowRight") next();
            else if (e.key === "Escape" && onClose) onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [prev, next, onClose]);
}
