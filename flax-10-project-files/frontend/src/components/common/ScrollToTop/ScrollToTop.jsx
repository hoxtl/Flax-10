import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        if (pathname.startsWith("/calendar")) {
            return;
        }

        window.scrollTo(0, 0);

        const mainContainer = document.querySelector(".mainContent") || document.querySelector(".main") || document.querySelector("main");
        if (mainContainer) {
            mainContainer.scrollTop = 0;
        }

        const scrollable = findScrollableParent();
        if (scrollable) {
            scrollable.scrollTop = 0;
        }
    }, [pathname]);

    return null;
}

function findScrollableParent() {
    const containers = document.querySelectorAll("*");
    for (const el of containers) {
        const style = window.getComputedStyle(el);
        const isScrollable = style.overflow === "auto" || style.overflowY === "auto" || style.overflow === "scroll" || style.overflowY === "scroll";
        if (isScrollable && el.scrollHeight > el.clientHeight && el !== document.body && el !== document.documentElement) {
            return el;
        }
    }
    return null;
}
