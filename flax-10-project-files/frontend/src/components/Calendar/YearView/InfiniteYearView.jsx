import { useRef, useEffect } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { useInfiniteCalendar } from '../hooks/useInfiniteCalendar';
import { YearGrid } from './YearGrid';
import './YearView.css';
import styles from './InfiniteYearView.module.css';

function YearSection({ section, sectionRef }) {
    return (
        <div ref={sectionRef} className={styles.yearSection} data-year-key={section.key}>
            <YearGrid year={section.date.getFullYear()} events={section.events} />
        </div>
    );
}

function LoadingIndicator({ isLoading }) {
    if (!isLoading) return null;
    return (
        <div className={styles.loading}>
            <span className={styles.loadingText}>Loading...</span>
        </div>
    );
}

export function InfiniteYearView() {
    const { selectedDate } = useCalendar();
    const dispatch = useCalendarDispatch();

    const { sections, loadPrevious, loadNext, isLoadingPrev, isLoadingNext } = useInfiniteCalendar(selectedDate, 'year');

    const containerRef = useRef(null);
    const topSentinelRef = useRef(null);
    const bottomSentinelRef = useRef(null);
    const sectionRefs = useRef({});
    const lastVisibleKeyRef = useRef(null);
    const sectionsRef = useRef(sections);
    sectionsRef.current = sections;

    useEffect(() => {
        const scrollContainer = document.querySelector('[data-dashboard-main]');
        if (!scrollContainer) return;

        const updateVisibleYear = () => {
            if (!containerRef.current) return;

            const containerRect = scrollContainer.getBoundingClientRect();
            const viewportMid = containerRect.top + containerRect.height / 3;

            for (const section of sectionsRef.current) {
                const el = sectionRefs.current[section.key];
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                if (rect.top <= viewportMid && rect.bottom > viewportMid) {
                    if (lastVisibleKeyRef.current !== section.key) {
                        lastVisibleKeyRef.current = section.key;
                        dispatch?.({ type: 'SET_SELECTED_DATE', payload: section.date });
                    }
                    break;
                }
            }
        };

        const loadObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    if (entry.target === topSentinelRef.current) loadPrevious();
                    if (entry.target === bottomSentinelRef.current) loadNext();
                });
            },
            { root: scrollContainer, rootMargin: '200px', threshold: 0 }
        );

        if (topSentinelRef.current) loadObserver.observe(topSentinelRef.current);
        if (bottomSentinelRef.current) loadObserver.observe(bottomSentinelRef.current);

        const handleScroll = () => requestAnimationFrame(updateVisibleYear);
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            loadObserver.disconnect();
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [loadPrevious, loadNext, dispatch]);

    return (
        <div ref={containerRef} className={styles.container}>
            <div ref={topSentinelRef} className={styles.sentinelTrigger} />
            <LoadingIndicator isLoading={isLoadingPrev} />

            {sections.map(section => (
                <YearSection
                    key={section.key}
                    section={section}
                    sectionRef={el => { sectionRefs.current[section.key] = el; }}
                />
            ))}

            <LoadingIndicator isLoading={isLoadingNext} />
            <div ref={bottomSentinelRef} className={styles.sentinelTrigger} />
        </div>
    );
}
