import { useRef, useEffect } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { useInfiniteCalendar } from '../hooks/useInfiniteCalendar';
import { WeekdayHeader } from './WeekdayHeader';
import { WeekRow } from './WeekRow';
import './MonthView.css';
import styles from './InfiniteMonthView.module.css';

function MonthSection({ section, readOnly, onMoreClick, customTags, sectionRef }) {
    const weeks = getMonthWeeks(section.date);

    return (
        <div ref={sectionRef} className={styles.monthSection} data-month-key={section.key}>
            <div className="month-grid">
                <WeekdayHeader />
                {weeks.map((w, i) => (
                    <WeekRow
                        key={i}
                        days={w}
                        events={section.events}
                        cur={section.date}
                        readOnly={readOnly}
                        onMoreClick={onMoreClick}
                        customTags={customTags}
                    />
                ))}
            </div>
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

export function InfiniteMonthView({ readOnly: propReadOnly, customTags }) {
    const { selectedDate, readOnly: contextReadOnly } = useCalendar();
    const dispatch = useCalendarDispatch();
    const isReadOnly = propReadOnly ?? contextReadOnly;

    const { sections, loadPrevious, loadNext, isLoadingPrev, isLoadingNext } = useInfiniteCalendar(selectedDate, 'month');

    const containerRef = useRef(null);
    const topSentinelRef = useRef(null);
    const bottomSentinelRef = useRef(null);
    const sectionRefs = useRef({});
    const lastVisibleKeyRef = useRef(null);
    const sectionsRef = useRef(sections);
    sectionsRef.current = sections;

    const handleMoreClick = (date) => {
        dispatch?.({ type: 'SET_SELECTED_DATE', payload: date });
        dispatch?.({ type: 'SET_VIEW_MODE', payload: 'day' });
    };

    useEffect(() => {
        const scrollContainer = document.querySelector('[data-dashboard-main]');
        if (!scrollContainer) return;

        const updateVisibleMonth = () => {
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

        const handleScroll = () => requestAnimationFrame(updateVisibleMonth);
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
                <MonthSection
                    key={section.key}
                    section={section}
                    sectionRef={el => { sectionRefs.current[section.key] = el; }}
                    readOnly={isReadOnly}
                    onMoreClick={handleMoreClick}
                    customTags={customTags}
                />
            ))}

            <LoadingIndicator isLoading={isLoadingNext} />
            <div ref={bottomSentinelRef} className={styles.sentinelTrigger} />
        </div>
    );
}

function getMonthWeeks(date) {
    const weeks = [];
    const current = getStartDate(date);
    const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    while (shouldContinue(current, last)) {
        weeks.push(generateWeek(current));
    }
    return weeks;
}

function shouldContinue(current, last) {
    if (current <= last) return true;
    return current.getDay() !== 0;
}

function getStartDate(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setDate(d.getDate() - d.getDay());
    return d;
}

function generateWeek(current) {
    const week = [];
    for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return week;
}
