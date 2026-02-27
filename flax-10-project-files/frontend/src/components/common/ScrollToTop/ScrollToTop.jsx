import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./ScrollToTop.module.css";

export default function ScrollToTop({ threshold = 200 }) {
    const [visible, setVisible] = useState(false);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const container = findScrollableParent();
        scrollContainerRef.current = container;
        if (!container) return;

        const handler = () => setVisible(getScrollTop(container) > threshold);
        container.addEventListener("scroll", handler);
        return () => container.removeEventListener("scroll", handler);
    }, [threshold]);

    const handleClick = useCallback(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    if (!visible) return null;
    return <button className={styles.scrollBtn} onClick={handleClick} aria-label="Scroll to top">↑</button>;
}

function findScrollableParent() {
    const content = document.querySelector('[class*="content"]');
    if (content && isScrollable(content)) return content;
    return document.documentElement;
}

function isScrollable(element) {
    const style = window.getComputedStyle(element);
    return style.overflow === "auto" || style.overflowY === "auto" || style.overflow === "scroll";
}

function getScrollTop(element) {
    return element === document.documentElement ? window.scrollY : element.scrollTop;
}
