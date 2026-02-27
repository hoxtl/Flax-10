import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PAGE_SIZE = 12;

export function useInfiniteScroll(items, pageSize = DEFAULT_PAGE_SIZE) {
    const [visibleCount, setVisibleCount] = useState(pageSize);
    const observerRef = useRef(null);
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
        if (!sentinelRef.current) return;
        observerRef.current?.disconnect();
        observerRef.current = new IntersectionObserver(
            entries => { if (entries[0]?.isIntersecting) loadMore(); },
            { rootMargin: "100px", threshold: 0 }
        );
        observerRef.current.observe(sentinelRef.current);
        return () => observerRef.current?.disconnect();
    }, [loadMore]);

    return { visibleItems, hasMore, sentinelRef, reset };
}
