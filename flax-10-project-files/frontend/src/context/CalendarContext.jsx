import { createContext, useContext, useReducer } from "react";
import { calendarReducer, initialState } from "./calendarReducer";

const CalendarContext = createContext(null);
const CalendarDispatchContext = createContext(null);

export function CalendarProvider({ children }) {
    const [state, dispatch] = useReducer(calendarReducer, initialState);

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

    // Derived state: filter events based on the current filter
    const currentFilter = Array.isArray(context.filter) ? context.filter : [context.filter];
    const filteredEvents = currentFilter.includes('all')
        ? context.events
        : context.events.filter(e => currentFilter.includes(e.tag_name));

    return { ...context, events: filteredEvents, allEvents: context.events };
}

export function useCalendarDispatch() {
    return useContext(CalendarDispatchContext);
}

export function useEventModal() {
    const { modalEvent, modalType, isModalOpen } = useCalendar();
    const dispatch = useCalendarDispatch();

    const openModal = (event = null, type = null) => {
        dispatch({ type: 'OPEN_MODAL', payload: { event, type } });
    };
    const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });

    return { modalEvent, modalType, isModalOpen, openModal, closeModal };
}