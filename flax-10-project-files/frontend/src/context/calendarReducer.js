/*
    This function is used to handle the calendar reducer.
    It includes the initial state, handlers, and update event function.
*/
export const initialState = {
    events: [],
    selectedDate: new Date(),
    viewMode: 'week',
    isLoading: false,
    error: null,
    modalEvent: null,
    isModalOpen: false,
};

/*
    This function is used to handle the handlers.
*/
const handlers = {
    SET_EVENTS: (state, payload) => ({ ...state, events: payload, isLoading: false }),
    ADD_EVENT: (state, payload) => ({ ...state, events: [...state.events, payload] }),
    UPDATE_EVENT: (state, payload) => ({ ...state, events: updateEvent(state.events, payload) }),
    DELETE_EVENT: (state, payload) => ({ ...state, events: state.events.filter(e => e.id !== payload) }),
    SET_VIEW_MODE: (state, payload) => ({ ...state, viewMode: payload }),
    SET_SELECTED_DATE: (state, payload) => ({ ...state, selectedDate: payload }),
    SET_LOADING: (state, payload) => ({ ...state, isLoading: payload }),
    SET_ERROR: (state, payload) => ({ ...state, error: payload, isLoading: false }),
    OPEN_MODAL: (state, payload) => ({ ...state, modalEvent: payload, isModalOpen: true }),
    CLOSE_MODAL: (state) => ({ ...state, modalEvent: null, isModalOpen: false }),
};

/*
    This function is used to handle the calendar reducer.
*/
export function calendarReducer(state, action) {
    const handler = handlers[action.type];
    return handler ? handler(state, action.payload) : state;
}

/*
    This function is used to handle the update event.
*/
function updateEvent(events, updatedEvent) {
    return events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
}
