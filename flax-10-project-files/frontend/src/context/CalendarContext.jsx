import { createContext, useContext, useReducer } from "react";
import { calendarReducer, initialState } from "./calendarReducer";
import { useReminderNotifications } from "../components/Notifications/hooks/useReminderNotifications";
import { getEffectiveTagName } from "../components/Calendar/utils/eventUtils";

const CalendarContext = createContext(null);
const CalendarDispatchContext = createContext(null);

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
    if (!context) {
        return {
            events: [],
            allEvents: [],
            selectedDate: new Date(),
            viewMode: 'month',
            displayMode: 'grid',
            filter: 'all'
        };
    }
    return getFilteredContext(context);
}

function getFilteredContext(context) {
    const currentFilter = Array.isArray(context.filter) ? context.filter : [context.filter];
    let filtered = filterEventsByTag(context.events, currentFilter);
    filtered = filterEventsBySearch(filtered, context.searchQuery);
    return { ...context, events: filtered, allEvents: context.events };
}

function filterEventsByTag(events, filter) {
    if (filter.includes('all')) return events;
    return events.filter(e => filter.includes(getEffectiveTagName(e)));
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
    const context = useContext(CalendarContext);
    const filtered = context ? getFilteredContext(context) : null;
    return {
        selectedDate: props.selectedDate ?? filtered?.selectedDate ?? new Date(),
        events: props.events ?? filtered?.events ?? [],
        viewMode: props.viewMode ?? filtered?.viewMode ?? 'month',
        displayMode: props.displayMode ?? filtered?.displayMode ?? 'grid',
    };
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

    const { popupEvent, popupAnchorRect, readOnly } = context;
    const openPopup = (event, anchorRect) => dispatch({ type: 'OPEN_POPUP', payload: { event, anchorRect } });
    const closePopup = () => dispatch({ type: 'CLOSE_POPUP' });
    return { popupEvent, popupAnchorRect, readOnly, openPopup, closePopup };
}