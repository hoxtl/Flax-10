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
