import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PAGE_SIZE = 12;
const SCROLL_THRESHOLD = 300;

export function useInfiniteScroll(items, pageSize = DEFAULT_PAGE_SIZE) {
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const sentinelRef = useRef(null);

    const visibleItems = items.slice(0, visibleCount);
    const hasMore = visibleCount < items.length;

    const loadMore = useCallback(() => {
        if (visibleCount >= items.length) return;
        setVisibleCount(prev => Math.min(prev + pageSize, items.length));
    }, [pageSize, items.length, visibleCount]);

    const reset = useCallback(() => setVisibleCount(pageSize), [pageSize]);

    useEffect(() => { reset(); }, [items.length, reset]);

    useEffect(() => {
        const scrollContainer = findScrollableAncestor(sentinelRef.current);
        if (!scrollContainer) return;

        const handleScroll = () => {
            if (visibleCount >= items.length) return;
            const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            if (distanceFromBottom < SCROLL_THRESHOLD) loadMore();
        };

        scrollContainer.addEventListener("scroll", handleScroll);
        return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }, [loadMore, visibleCount, items.length]);

    return { visibleItems, hasMore, sentinelRef, reset };
}

function findScrollableAncestor(element) {
    let parent = element?.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        const hasOverflow = style.overflow === "auto" || style.overflowY === "auto";
        if (hasOverflow) return parent;
        parent = parent.parentElement;
    }
    return null;
}
