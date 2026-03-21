import { createContext, useContext, useReducer, useMemo } from "react";
import { calendarReducer, initialState } from "./calendarReducer";
import { useReminderNotifications } from "../components/notifications/hooks/useReminderNotifications";
import { getEffectiveTagName } from "../components/calendar/utils/eventUtils";

const CalendarContext = createContext(null);
const CalendarDispatchContext = createContext(null);
const DEFAULT_CONTEXT = { events: [], allEvents: [], selectedDate: new Date(), viewMode: 'month', displayMode: 'grid', filter: 'all', reloadKey: 0 };

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
<<<<<<< HEAD
    const currentFilter = [filter].flat(Infinity)
=======
    const currentFilter = (Array.isArray(filter) ? filter.flat(Infinity) : [filter])
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

export function useCalendarData(props = {}) {
    const calendarState = useCalendar();
    return useMemo(() => ({
<<<<<<< HEAD
        selectedDate: props.selectedDate ?? calendarState.selectedDate,
        events: props.events ?? calendarState.events,
        viewMode: props.viewMode ?? calendarState.viewMode,
        displayMode: props.displayMode ?? calendarState.displayMode,
=======
        selectedDate: props.selectedDate ?? calendarState.selectedDate ?? new Date(),
        events: props.events ?? calendarState.events ?? [],
        viewMode: props.viewMode ?? calendarState.viewMode ?? 'month',
        displayMode: props.displayMode ?? calendarState.displayMode ?? 'grid',
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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

<<<<<<< HEAD
    const { popupEvent, popupAnchorRect, readOnly: contextReadOnly, popupReadOnly, viewMode, popupViewMode } = context;
=======
    const { popupEvent, popupAnchorRect, readOnly: contextReadOnly, viewMode, popupViewMode } = context;
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    const openPopup = (event, anchorRect, readOnlyOverride = null, viewModeOverride = null) => {
        const readOnly = readOnlyOverride === null ? (contextReadOnly || false) : readOnlyOverride;
        dispatch({ type: 'OPEN_POPUP', payload: { event, anchorRect, readOnly, viewModeOverride } });
    };
    const closePopup = () => dispatch({ type: 'CLOSE_POPUP' });
<<<<<<< HEAD
    return { popupEvent, popupAnchorRect, readOnly: popupReadOnly || contextReadOnly, viewMode: popupViewMode || viewMode, openPopup, closePopup };
=======
    return { popupEvent, popupAnchorRect, readOnly: contextReadOnly, viewMode: popupViewMode || viewMode, openPopup, closePopup };
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

export function useEventDelete() {
    const context = useContext(CalendarContext);
    const dispatch = useContext(CalendarDispatchContext);
    if (!context || !dispatch) return { isDeleteOpen: false, deleteEvent: null, deleteType: null, openDelete: () => { }, closeDelete: () => { } };
    const { isDeleteConfirmOpen, deleteConfirmEvent, deleteConfirmType } = context;
    const openDelete = (event, type = null) => dispatch({ type: 'OPEN_DELETE_CONFIRM', payload: { event, type } });
    const closeDelete = () => dispatch({ type: 'CLOSE_DELETE_CONFIRM' });
    return { isDeleteOpen: isDeleteConfirmOpen, deleteEvent: deleteConfirmEvent, deleteType: deleteConfirmType, openDelete, closeDelete };
}
