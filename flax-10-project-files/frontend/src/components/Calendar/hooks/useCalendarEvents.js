import { useEffect, useCallback } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { getEvents, createEvent, updateEvent, deleteEvent, addExceptionDate } from '../../../api/event_api';
import { getDateRangeForView } from './calendarHelpers';

export function useCalendarEvents() {
    const { events } = useCalendar();
    const loadEvents = useEventLoader();
    useEffect(() => { loadEvents(); }, [loadEvents]);
    return { events, loadEvents };
}

function useEventLoader() {
    const { selectedDate, viewMode } = useCalendar();
    const dispatch = useCalendarDispatch();
    return useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const { start, end } = getDateRangeForView(selectedDate, viewMode);
            dispatch({ type: 'SET_EVENTS', payload: await getEvents({ start, end }) });
        } catch (error) { dispatch({ type: 'SET_ERROR', payload: error.message }); }
    }, [selectedDate, viewMode, dispatch]);
}

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