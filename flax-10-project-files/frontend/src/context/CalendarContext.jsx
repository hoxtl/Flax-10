import { createContext, useContext, useReducer, useMemo } from "react";
import { calendarReducer, initialState } from "./calendarReducer";
import { useReminderNotifications } from "../components/Notifications/hooks/useReminderNotifications";
import { getEffectiveTagName } from "../components/Calendar/utils/eventUtils";

const CalendarContext = createContext(null);
const CalendarDispatchContext = createContext(null);
const DEFAULT_CONTEXT = { events: [], allEvents: [], selectedDate: new Date(), viewMode: 'month', displayMode: 'grid', filter: 'all' };

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

export function useCalendar() {
    const context = useContext(CalendarContext);
    const filter = context?.filter;
    const searchQuery = context?.searchQuery;
    const events = context?.events;

    const filteredEvents = useMemo(() => {
        if (!events) return [];
        return applyFilters(events, filter, searchQuery);
    }, [events, filter, searchQuery]);

    return useMemo(() => {
        if (!context) return DEFAULT_CONTEXT;
        return { ...context, events: filteredEvents, allEvents: context.events };
    }, [context, filteredEvents]);
}

function applyFilters(events, filter, searchQuery) {
    let result = filterEventsByTag(events, filter);
    return filterEventsBySearch(result, searchQuery);
}

function filterEventsByTag(events, filter) {
    const currentFilter = Array.isArray(filter) ? filter : [filter];
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

export function useCalendarData(props = {}) {
    const calendarState = useCalendar();
    return useMemo(() => ({
        selectedDate: props.selectedDate ?? calendarState.selectedDate ?? new Date(),
        events: props.events ?? calendarState.events ?? [],
        viewMode: props.viewMode ?? calendarState.viewMode ?? 'month',
        displayMode: props.displayMode ?? calendarState.displayMode ?? 'grid',
    }), [props.selectedDate, props.events, props.viewMode, props.displayMode, calendarState]);
}

export function useCalendarDispatch() {
    return useContext(CalendarDispatchContext);
}

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

export function useEventPopup() {
    const context = useContext(CalendarContext);
    const dispatch = useContext(CalendarDispatchContext);

    if (!context || !dispatch) {
        return { popupEvent: null, popupAnchorRect: null, readOnly: false, openPopup: () => { }, closePopup: () => { } };
    }

    const { popupEvent, popupAnchorRect, readOnly, viewMode } = context;
    const openPopup = (event, anchorRect) => dispatch({ type: 'OPEN_POPUP', payload: { event, anchorRect } });
    const closePopup = () => dispatch({ type: 'CLOSE_POPUP' });
    return { popupEvent, popupAnchorRect, readOnly, viewMode, openPopup, closePopup };
}