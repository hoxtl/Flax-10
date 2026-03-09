import { useState, useCallback, useRef, useEffect } from 'react';
import { getEvents } from '../../../api/eventApi';
import { getDateRangeForView } from './calendarHelpers';

function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function createSection(date, events = []) {
    return { date: new Date(date), key: getMonthKey(date), events };
}

export function useInfiniteCalendar(baseDate, viewMode) {
    const [sections, setSections] = useState(() => [createSection(baseDate)]);
    const [isLoadingPrev, setIsLoadingPrev] = useState(false);
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const containerRef = useRef(null);
    const loadedKeys = useRef(new Set());

    const loadEventsForSection = useCallback(async (date) => {
        const key = getMonthKey(date);
        if (loadedKeys.current.has(key)) return null;
        loadedKeys.current.add(key);

        const { start, end } = getDateRangeForView(date, 'month');
        const events = await getEvents({ start, end });
        return { key, events };
    }, []);

    const loadPrevious = useCallback(async () => {
        if (isLoadingPrev) return;
        setIsLoadingPrev(true);

        const firstSection = sections[0];
        const prevDate = addMonths(firstSection.date, -1);
        const result = await loadEventsForSection(prevDate);

        if (result) {
            const scrollHeight = containerRef.current?.scrollHeight || 0;
            setSections(prev => [createSection(prevDate, result.events), ...prev]);

            requestAnimationFrame(() => {
                if (!containerRef.current) return;
                const newScrollHeight = containerRef.current.scrollHeight;
                containerRef.current.scrollTop += newScrollHeight - scrollHeight;
            });
        }
        setIsLoadingPrev(false);
    }, [sections, isLoadingPrev, loadEventsForSection]);

    const loadNext = useCallback(async () => {
        if (isLoadingNext) return;
        setIsLoadingNext(true);

        const lastSection = sections[sections.length - 1];
        const nextDate = addMonths(lastSection.date, 1);
        const result = await loadEventsForSection(nextDate);

        if (result) {
            setSections(prev => [...prev, createSection(nextDate, result.events)]);
        }
        setIsLoadingNext(false);
    }, [sections, isLoadingNext, loadEventsForSection]);

    useEffect(() => {
        loadEventsForSection(baseDate).then(result => {
            if (result) {
                setSections([createSection(baseDate, result.events)]);
            }
        });
    }, [baseDate, loadEventsForSection]);

    return {
        sections,
        loadPrevious,
        loadNext,
        isLoadingPrev,
        isLoadingNext,
        containerRef
    };
}
