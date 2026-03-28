/*
 * Calendar context state and shared view data hooks.
 */

import { createContext, useContext, useReducer, useMemo } from "react";
import { calendarReducer, initialState } from "./calendarReducer";
import { useReminderNotifications } from "../components/notifications/hooks/useReminderNotifications";
import { dedupeEvents, getEffectiveTagName } from "../components/calendar/utils/eventUtils";

const CalendarContext = createContext(null);
const CalendarDispatchContext = createContext(null);
const DEFAULT_CONTEXT = { events: [], allEvents: [], selectedDate: new Date(), viewMode: 'month', displayMode: 'grid', filter: 'all', reloadKey: 0 };

/** Provides calendar state and dispatch to descendant calendar features. */

export function CalendarProvider({ children }) {
    const [state, dispatch] = useReducer(calendarReducer, initialState);
    useReminderNotifications(state.events);

    return (
        <CalendarContext.Provider value={state}>
            <CalendarDispatchContext.Provider value={dispatch}>
                {children}
            </CalendarDispatchContext.Provider>
        </CalendarContext.Provider>
    );
}

/** Returns filtered calendar state together with the full deduplicated event list. */

export function useCalendar() {
    const context = useContext(CalendarContext);
    const filter = context?.filter;
    const searchQuery = context?.searchQuery;
    const uniqueEvents = useMemo(() => dedupeEvents(context?.events), [context?.events]);

    const filteredEvents = useMemo(() => {
        return applyFilters(uniqueEvents, filter, searchQuery);
    }, [uniqueEvents, filter, searchQuery]);

    return useMemo(() => {
        if (!context) return DEFAULT_CONTEXT;
        return { ...context, events: filteredEvents, allEvents: uniqueEvents };
    }, [context, filteredEvents, uniqueEvents]);
}

function applyFilters(events, filter, searchQuery) {
    let result = filterEventsByTag(events, filter);
    return filterEventsBySearch(result, searchQuery);
}

function filterEventsByTag(events, filter) {
    const currentFilter = [filter].flat(Infinity)
        .filter((value) => typeof value === 'string')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    if (currentFilter.includes('all')) return events;
    return events.filter(e => currentFilter.includes(getEffectiveTagName(e)));
}

function filterEventsBySearch(events, query) {
    if (!query || !query.trim()) return events;
    const q = query.toLowerCase().trim();
    return events.filter(e => matchesSearch(e, q));
}

function matchesSearch(event, query) {
    const title = (event.title || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const location = (event.location || '').toLowerCase();
    return title.includes(query) || description.includes(query) || location.includes(query);
}

/** Returns calendar view data with prop overrides and deduplicated events. */

export function useCalendarData(props = {}) {
    const calendarState = useCalendar();
    const events = useMemo(() => dedupeEvents(props.events ?? calendarState.events), [props.events, calendarState.events]);
    return useMemo(() => ({
        selectedDate: props.selectedDate ?? calendarState.selectedDate,
        events,
        viewMode: props.viewMode ?? calendarState.viewMode,
        displayMode: props.displayMode ?? calendarState.displayMode,
    }), [props.selectedDate, props.viewMode, props.displayMode, calendarState, events]);
}

/** Returns the calendar dispatch function when a provider is available. */

export function useCalendarDispatch() {
    return useContext(CalendarDispatchContext);
}

/** Returns event modal state plus open and close helpers. */

export function useEventModal() {
    const context = useContext(CalendarContext);
    const dispatch = useContext(CalendarDispatchContext);

    if (!context || !dispatch) {
        return { modalEvent: null, modalType: null, modalInitialDate: null, isModalOpen: false, openModal: () => { }, closeModal: () => { } };
    }

    const { modalEvent, modalType, modalInitialDate, isModalOpen } = context;
    const openModal = (event = null, type = null, initialDate = null) => {
        dispatch({ type: 'OPEN_MODAL', payload: { event, type, initialDate } });
    };
    const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });
    return { modalEvent, modalType, modalInitialDate, isModalOpen, openModal, closeModal };
}

/** Returns event popup state plus open and close helpers. */

export function useEventPopup() {
    const context = useContext(CalendarContext);
    const dispatch = useContext(CalendarDispatchContext);

    if (!context || !dispatch) {
        return { popupEvent: null, popupAnchorRect: null, readOnly: false, openPopup: () => { }, closePopup: () => { } };
    }

    const { popupEvent, popupAnchorRect, readOnly: contextReadOnly, popupReadOnly, viewMode, popupViewMode } = context;
    const openPopup = (event, anchorRect, readOnlyOverride = null, viewModeOverride = null) => {
        const readOnly = readOnlyOverride === null ? (contextReadOnly || false) : readOnlyOverride;
        dispatch({ type: 'OPEN_POPUP', payload: { event, anchorRect, readOnly, viewModeOverride } });
    };
    const closePopup = () => dispatch({ type: 'CLOSE_POPUP' });
    return { popupEvent, popupAnchorRect, readOnly: popupReadOnly || contextReadOnly, viewMode: popupViewMode || viewMode, openPopup, closePopup };
}

/** Returns delete-confirmation state plus open and close helpers. */

export function useEventDelete() {
    const context = useContext(CalendarContext);
    const dispatch = useContext(CalendarDispatchContext);
    if (!context || !dispatch) return { isDeleteOpen: false, deleteEvent: null, deleteType: null, openDelete: () => { }, closeDelete: () => { } };
    const { isDeleteConfirmOpen, deleteConfirmEvent, deleteConfirmType } = context;
    const openDelete = (event, type = null) => dispatch({ type: 'OPEN_DELETE_CONFIRM', payload: { event, type } });
    const closeDelete = () => dispatch({ type: 'CLOSE_DELETE_CONFIRM' });
    return { isDeleteOpen: isDeleteConfirmOpen, deleteEvent: deleteConfirmEvent, deleteType: deleteConfirmType, openDelete, closeDelete };
}
