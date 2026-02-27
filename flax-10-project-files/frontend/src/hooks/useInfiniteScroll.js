import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PAGE_SIZE = 12;

export function useInfiniteScroll(items, pageSize = DEFAULT_PAGE_SIZE) {
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const observerRef = useRef(null);
    const sentinelRef = useRef(null);

    const visibleItems = items.slice(0, visibleCount);
    const hasMore = visibleCount < items.length;

    const loadMore = useCallback(() => {
        if (!hasMore) return;
        setVisibleCount(prev => Math.min(prev + pageSize, items.length));
    }, [hasMore, pageSize, items.length]);

    const reset = useCallback(() => setVisibleCount(pageSize), [pageSize]);

    useEffect(() => { reset(); }, [items.length, reset]);

    useEffect(() => {
        const root = findScrollableParent();
        observerRef.current = createObserver(loadMore, root);
        if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [loadMore]);

    return { visibleItems, hasMore, sentinelRef, reset };
}

function createObserver(callback, root) {
    const options = { rootMargin: "200px" };
    if (root && root !== document.documentElement) options.root = root;
    return new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting) callback();
    }, options);
}

function findScrollableParent() {
    const content = document.querySelector('[class*="content"]');
    if (content && isScrollable(content)) return content;
    return null;
}

function isScrollable(element) {
    const style = window.getComputedStyle(element);
    return style.overflow === "auto" || style.overflowY === "auto";
}
