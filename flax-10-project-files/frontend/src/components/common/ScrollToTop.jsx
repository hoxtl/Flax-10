import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Exclude calendar from auto-scroll, as it manages its own scroll to 'current time'
        if (pathname.startsWith("/calendar")) {
            return;
        }

        // Scroll window to top
        window.scrollTo(0, 0);

        // Scroll the main content container to top
        const mainContainer = document.querySelector(".mainContent") || document.querySelector(".main") || document.querySelector("main");
        if (mainContainer) {
            mainContainer.scrollTop = 0;
        }

        // Also find any arbitrary scrollable parents and reset them as a fallback
        const scrollable = findScrollableParent(document.body);
        if (scrollable) {
            scrollable.scrollTop = 0;
        }

    }, [pathname]);

    return null;
}

function findScrollableParent(element) {
    if (!element) return null;
    const containers = document.querySelectorAll('*');
    for (const el of containers) {
        const style = window.getComputedStyle(el);
        const isScrollable = style.overflow === 'auto' || style.overflowY === 'auto' || style.overflow === 'scroll' || style.overflowY === 'scroll';
        if (isScrollable && el.scrollHeight > el.clientHeight && el !== document.body && el !== document.documentElement) {
            return el;
        }
    }
    return null;
}
