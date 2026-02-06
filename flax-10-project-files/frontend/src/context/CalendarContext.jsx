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
    return useContext(CalendarContext);
}

export function useCalendarDispatch() {
    return useContext(CalendarDispatchContext);
}

export function useEventModal() {
    const { modalEvent, isModalOpen } = useCalendar();
    const dispatch = useCalendarDispatch();

    const openModal = (event = null) => dispatch({ type: 'OPEN_MODAL', payload: event });
    const closeModal = () => dispatch({ type: 'CLOSE_MODAL' });

    return { modalEvent, isModalOpen, openModal, closeModal };
}