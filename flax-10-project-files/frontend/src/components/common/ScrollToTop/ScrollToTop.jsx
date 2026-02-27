import { useState, useEffect, useCallback } from "react";
import styles from "./ScrollToTop.module.css";

export default function ScrollToTop({ pageBreaks = [0], threshold = 200 }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = () => setVisible(window.scrollY > threshold);
        window.addEventListener("scroll", handler);
        return () => window.removeEventListener("scroll", handler);
    }, [threshold]);

    const handleClick = useCallback(() => {
        const target = findPreviousPageBreak(pageBreaks, window.scrollY);
        window.scrollTo({ top: target, behavior: "smooth" });
    }, [pageBreaks]);

    if (!visible) return null;
    return <button className={styles.scrollBtn} onClick={handleClick} aria-label="Scroll up">↑</button>;
}

function findPreviousPageBreak(pageBreaks, currentScroll) {
    const positions = getPageBreakPositions(pageBreaks);
    const previous = positions.filter(pos => pos < currentScroll - 50);
    return previous.length > 0 ? previous[previous.length - 1] : 0;
}

function getPageBreakPositions(pageBreaks) {
    return pageBreaks.map((_, idx) => idx * window.innerHeight * 0.8);
}
