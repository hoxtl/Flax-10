import { useEffect, useCallback } from 'react';
import { useCalendar, useCalendarDispatch } from '../context/CalendarContext';
import { getEvents, createEvent, updateEvent, deleteEvent, addExceptionDate } from '../api/event_api';
import { getDateRangeForView } from './calendarHelpers';

/**
 * Hook that handles fetching and managing calendar events.
 * It automatically loads events when the selected date or view mode changes
 * @returns the events array and a function to manually reload events if needed.
 */

export function useCalendarEvents() {
    const { selectedDate, viewMode, events } = useCalendar();
    const dispatch = useCalendarDispatch();
    const loadEvents = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const { start, end } = getDateRangeForView(selectedDate, viewMode);
            const data = await getEvents({ start, end });
            dispatch({ type: 'SET_EVENTS', payload: data });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    }, [selectedDate, viewMode, dispatch]);
    useEffect(() => { loadEvents(); }, [loadEvents]);
    return { events, loadEvents };
}

/**
 * Hook that provides functions to add, edit, and delete events
 * These functions handle both the API call and updating the local state
 * Use this when you need to modify events (forms, drag-drop, etc.)
 * @returns 
 */
export function useEventActions() {
    const { selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();
    const loadEvents = useCallback(async () => {
        const { start, end } = getDateRangeForView(selectedDate, viewMode);
        const data = await getEvents({ start, end });
        dispatch({ type: 'SET_EVENTS', payload: data });
    }, [selectedDate, viewMode, dispatch]);
    return {
        addEvent: createAddEvent(loadEvents),
        editEvent: createEditEvent(loadEvents),
        removeEvent: createRemoveEvent(dispatch, loadEvents),
        addException: createAddException(loadEvents),
    };
}

function createAddEvent(reload) {
    return async (eventData) => {
        const newEvent = await createEvent(eventData);
        await reload();
        return newEvent;
    };
}

function createEditEvent(reload) {
    return async (id, eventData) => {
        const updated = await updateEvent(id, eventData);
        await reload();
        return updated;
    };
}

function createRemoveEvent(dispatch, reload) {
    return async (id) => {
        await deleteEvent(id);
        await reload();
    };
}

function createAddException(reload) {
    return async (eventId, dateStr) => {
        await addExceptionDate(eventId, dateStr);
        await reload();
    };
}