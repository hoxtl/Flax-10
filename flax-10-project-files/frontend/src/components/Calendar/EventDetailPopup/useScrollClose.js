import { useEffect, useRef } from "react";

export function useScrollClose(anchorRect, onClose) {
    const initialRect = useRef(anchorRect);
    useEffect(() => {
        if (!anchorRect) return;
        initialRect.current = anchorRect;
        const handleScroll = () => {
            if (!initialRect.current) return;
            if (isOutOfView(initialRect.current)) onClose();
        };
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [anchorRect, onClose]);}

function isOutOfView(rect) {
    const margin = 50;
    return rect.top < -margin || rect.bottom > window.innerHeight + margin;
}
