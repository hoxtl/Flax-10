import { useEffect, useCallback } from 'react';
import { useCalendar, useCalendarDispatch } from '../context/CalendarContext';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../api/eventApi';
import { getDateRangeForView } from './calendarHelpers';

/**
 * Hook that handles fetching and managing calendar events.
 * It automatically loads events when the selected date or view mode changes
 * @returns the events array and a function to manually reload events if needed.
 */

export function useCalendarEvents() {
    const { selectedDate, viewMode, events } = useCalendar();
    const dispatch = useCalendarDispatch();

    // Fetches events from the API based on the current date range being viewed
    // Uses useCallback so it doesn't get recreated on every render, preventing infinite loops
    const loadEvents = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            // Figure out what date range we need based on day/week/month view
            const { start, end } = getDateRangeForView(selectedDate, viewMode);
            const data = await getEvents({ start, end });
            dispatch({ type: 'SET_EVENTS', payload: data });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    }, [selectedDate, viewMode, dispatch]);

    // Automatically fetch events whenever date or view mode changes
    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    return { events, loadEvents };
}

/**
 * Hook that provides functions to add, edit, and delete events
 * These functions handle both the API call and updating the local state
 * Use this when you need to modify events (forms, drag-drop, etc.)
 * @returns 
 */
export function useEventActions() {
    const dispatch = useCalendarDispatch();

    // Creates a new event and adds it to the calendar
    const addEvent = async (eventData) => {
        const newEvent = await createEvent(eventData);
        dispatch({ type: 'ADD_EVENT', payload: newEvent });
        return newEvent;
    };

    // Updates an existing event (by ID) and updates it in the calendar
    const editEvent = async (id, eventData) => {
        const updated = await updateEvent(id, eventData);
        dispatch({ type: 'UPDATE_EVENT', payload: updated });
        return updated;
    };

    // Deletes an event (by ID) and removes it from the calendar
    const removeEvent = async (id) => {
        await deleteEvent(id);
        dispatch({ type: 'DELETE_EVENT', payload: id });
    };

    return { addEvent, editEvent, removeEvent };
}