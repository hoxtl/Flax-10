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
    modalType: null,
    isModalOpen: false,
    filter: ['all'],
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
    OPEN_MODAL: (state, payload) => openModalHandler(state, payload),
    CLOSE_MODAL: (state) => ({ ...state, modalEvent: null, modalType: null, isModalOpen: false }),
    SET_FILTER: (state, payload) => ({ ...state, filter: toggleFilter(state.filter, payload) }),
};

/**
 * Toggles the filter state based on the selected payload.
 * Handles switching between 'all' and specific tags, and multi-select logic.
 */
function toggleFilter(currentFilter, payload) {
    if (payload === 'all') return ['all'];

    // Ensure currentFilter is always an array for consistent handling
    const current = Array.isArray(currentFilter) ? currentFilter : [currentFilter];

    // If resetting from 'all', just return the new payload
    if (current.includes('all')) return [payload];

    return updateFilterList(current, payload);
}

/**
 * Updates the list of active filters.
 * Adds the payload if not present, removes it if present.
 * Reverts to 'all' if the result would be empty.
 */
function updateFilterList(current, payload) {
    if (current.includes(payload)) {
        const newFilter = current.filter(t => t !== payload);
        // Default to 'all' if no filters remain
        return newFilter.length === 0 ? ['all'] : newFilter;
    }
    return [...current, payload];
}

/*
    This function is used to handle the calendar reducer.
*/
export function calendarReducer(state, action) {
    const handler = handlers[action.type];
    return handler ? handler(state, action.payload) : state;
}

function updateEvent(events, updatedEvent) {
    return events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
}

function openModalHandler(state, payload) {
    if (payload?.event !== undefined) {
        return { ...state, modalEvent: payload.event, modalType: payload.type || null, isModalOpen: true };
    }
    return { ...state, modalEvent: payload, modalType: null, isModalOpen: true };
}
