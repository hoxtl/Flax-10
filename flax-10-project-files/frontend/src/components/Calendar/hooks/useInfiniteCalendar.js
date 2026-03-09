import { useState, useCallback, useRef, useEffect } from 'react';
import { getEvents } from '../../../api/eventApi';
import { getDateRangeForView } from './calendarHelpers';

function addMonths(date, months) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
}

function addYears(date, years) {
    const d = new Date(date);
    d.setFullYear(d.getFullYear() + years);
    return d;
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getYearKey(date) {
    return `${date.getFullYear()}`;
}

function createSection(date, events, viewMode) {
    const key = viewMode === 'year' ? getYearKey(date) : getMonthKey(date);
    return { date: new Date(date), key, events: events || [] };
}

export function useInfiniteCalendar(baseDate, viewMode) {
    const [sections, setSections] = useState(() => [createSection(baseDate, [], viewMode)]);
    const [isLoadingPrev, setIsLoadingPrev] = useState(false);
    const [isLoadingNext, setIsLoadingNext] = useState(false);
    const loadedKeys = useRef(new Set());

    const getKey = viewMode === 'year' ? getYearKey : getMonthKey;
    const addUnit = viewMode === 'year' ? addYears : addMonths;

    const loadEventsForSection = useCallback(async (date) => {
        const key = getKey(date);
        if (loadedKeys.current.has(key)) return null;
        loadedKeys.current.add(key);

        const { start, end } = getDateRangeForView(date, viewMode);
        const events = await getEvents({ start, end });
        return { key, events };
    }, [viewMode, getKey]);

    const loadPrevious = useCallback(async () => {
        if (isLoadingPrev) return;
        setIsLoadingPrev(true);

        const firstSection = sections[0];
        const prevDate = addUnit(firstSection.date, -1);
        const result = await loadEventsForSection(prevDate);

        if (result) {
            setSections(prev => [createSection(prevDate, result.events, viewMode), ...prev]);
        }
        setIsLoadingPrev(false);
    }, [sections, isLoadingPrev, loadEventsForSection, addUnit, viewMode]);

    const loadNext = useCallback(async () => {
        if (isLoadingNext) return;
        setIsLoadingNext(true);

        const lastSection = sections[sections.length - 1];
        const nextDate = addUnit(lastSection.date, 1);
        const result = await loadEventsForSection(nextDate);

        if (result) {
            setSections(prev => [...prev, createSection(nextDate, result.events, viewMode)]);
        }
        setIsLoadingNext(false);
    }, [sections, isLoadingNext, loadEventsForSection, addUnit, viewMode]);

    const lastViewModeRef = useRef(viewMode);

    useEffect(() => {
        const viewModeChanged = lastViewModeRef.current !== viewMode;
        lastViewModeRef.current = viewMode;

        const baseDateKey = getKey(baseDate);
        const isWithinLoaded = loadedKeys.current.has(baseDateKey);

        if (viewModeChanged || !isWithinLoaded) {
            loadedKeys.current.clear();
            loadEventsForSection(baseDate).then(result => {
                if (result) {
                    setSections([createSection(baseDate, result.events, viewMode)]);
                }
            });
        }
    }, [baseDate, viewMode, loadEventsForSection, getKey]);

    return { sections, loadPrevious, loadNext, isLoadingPrev, isLoadingNext };
}
