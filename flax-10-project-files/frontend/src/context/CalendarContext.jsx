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
        throw new Error('useCalendar must be used within CalendarProvider');
    }
    return getFilteredContext(context);
}

function getFilteredContext(context) {
    const currentFilter = Array.isArray(context.filter) ? context.filter : [context.filter];
    const filteredEvents = filterEventsByTag(context.events, currentFilter);
    return { ...context, events: filteredEvents, allEvents: context.events };
}

function filterEventsByTag(events, filter) {
    if (filter.includes('all')) return events;
    return events.filter(e => filter.includes(getEffectiveTagName(e)));
}

export function useCalendarData(props = {}) {
    const context = useContext(CalendarContext);
    const filtered = context ? getFilteredContext(context) : null;
    return {
        selectedDate: props.selectedDate ?? filtered?.selectedDate ?? new Date(),
        events: props.events ?? filtered?.events ?? [],
        viewMode: props.viewMode ?? filtered?.viewMode ?? 'month',
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