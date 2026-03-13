/*
    This function is used to handle the calendar reducer.
    It includes the initial state, handlers, and update event function.
*/
export const initialState = {
    events: [],
    selectedDate: new Date(),
    viewMode: 'week',
    displayMode: 'grid',
    isLoading: false,
    error: null,
    modalEvent: null,
    modalType: null,
    modalInitialDate: null,
    isModalOpen: false,
    filter: ['all'],
    searchQuery: '',
    popupEvent: null,
    popupAnchorRect: null,
    readOnly: false,
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
    SET_DISPLAY_MODE: (state, payload) => ({ ...state, displayMode: payload }),
    SET_SELECTED_DATE: (state, payload) => ({ ...state, selectedDate: payload }),
    SET_LOADING: (state, payload) => ({ ...state, isLoading: payload }),
    SET_ERROR: (state, payload) => ({ ...state, error: payload, isLoading: false }),
    OPEN_MODAL: (state, payload) => openModalHandler(state, payload),
    CLOSE_MODAL: (state) => ({ ...state, modalEvent: null, modalType: null, modalInitialDate: null, isModalOpen: false }),
    SET_FILTER: (state, payload) => ({ ...state, filter: toggleFilter(state.filter, payload) }),
    SET_SEARCH_QUERY: (state, payload) => ({ ...state, searchQuery: payload }),
    OPEN_POPUP: (state, payload) => ({ ...state, popupEvent: payload.event, popupAnchorRect: payload.anchorRect }),
    CLOSE_POPUP: (state) => ({ ...state, popupEvent: null, popupAnchorRect: null }),
    SET_READ_ONLY: (state, payload) => ({ ...state, readOnly: payload }),
};

/**
 * Toggles the filter state based on the selected payload.
 * Handles switching between 'all' and specific tags, and multi-select logic.
 */
function toggleFilter(filter, payload) {
    if (payload === 'all') return ['all'];
    const items = new Set(filter);
    items.delete('all');
    if (items.has(payload)) {
        items.delete(payload);
    } else {
        items.add(payload);
    }
    const result = Array.from(items);
    return result.length > 0 ? result : ['all'];
}

export function calendarReducer(state, action) {
    const handler = handlers[action.type];
    return handler ? handler(state, action.payload) : state;
}

function updateEvent(events, updatedEvent) {
    return events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
}

function openModalHandler(state, payload) {
    const isEventPayload = payload?.event !== undefined;
    return {
        ...state,
        modalEvent: isEventPayload ? payload.event : payload,
        modalType: isEventPayload ? (payload.type || null) : null,
        modalInitialDate: (isEventPayload ? payload.initialDate : payload?.initialDate) || null,
        isModalOpen: true
    };
}
