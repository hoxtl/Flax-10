import { useState, useEffect } from 'react';

export function useHoverSummary(delay = 2000) {
    const [isHovered, setIsHovered] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    useEffect(() => {
        if (!isHovered) { setShowSummary(false); return; }
        const timer = setTimeout(() => setShowSummary(true), delay);
        return () => clearTimeout(timer);
    }, [isHovered, delay]);
    return {
        isHovered,
        showSummary,
        binder: { onMouseEnter: () => setIsHovered(true), onMouseLeave: () => setIsHovered(false) }
    };
}