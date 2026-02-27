import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./ScrollToTop.module.css";

export default function ScrollToTop({ threshold = 200 }) {
    const [visible, setVisible] = useState(false);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const container = buttonRef.current ? findScrollableAncestor(buttonRef.current) : null;
        containerRef.current = container;
        if (!container) return;

        const handler = () => setVisible(container.scrollTop > threshold);
        container.addEventListener("scroll", handler);
        handler();
        return () => container.removeEventListener("scroll", handler);
    }, [threshold]);

    const handleClick = useCallback(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <button
            ref={buttonRef}
            className={`${styles.scrollBtn} ${visible ? styles.visible : ""}`}
            onClick={handleClick}
            aria-label="Scroll to top"
        >
            ↑
        </button>
    );
}

function findScrollableAncestor(element) {
    let parent = element.parentElement;
    while (parent) {
        if (isScrollable(parent)) return parent;
        parent = parent.parentElement;
    }
    return document.documentElement;
}

function isScrollable(element) {
    const style = window.getComputedStyle(element);
    const hasOverflow = style.overflow === "auto" || style.overflowY === "auto" || style.overflow === "scroll";
    return hasOverflow && element.scrollHeight > element.clientHeight;
}
