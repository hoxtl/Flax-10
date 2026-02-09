import { useState, useRef, useEffect } from 'react';

export function useHoverSummary(delay = 2000) {
    const [isHovered, setIsHovered] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const timeoutRef = useRef(null);

    const onMouseEnter = () => {
        setIsHovered(true);
        timeoutRef.current = setTimeout(() => setShowSummary(true), delay);
    };

    const onMouseLeave = () => {
        setIsHovered(false);
        setShowSummary(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return { isHovered, showSummary, binder: { onMouseEnter, onMouseLeave } };
}
