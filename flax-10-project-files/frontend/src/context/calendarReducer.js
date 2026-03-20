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
    isDeleteConfirmOpen: false,
    deleteConfirmEvent: null,
    deleteConfirmType: null, // 'occurrence' or 'all' for recurring
    reloadKey: 0,
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
    OPEN_POPUP: (state, payload) => ({ ...state, popupEvent: payload.event, popupAnchorRect: payload.anchorRect, readOnly: payload.readOnly ?? false, popupViewMode: payload.viewModeOverride ?? null }),
    CLOSE_POPUP: (state) => ({ ...state, popupEvent: null, popupAnchorRect: null, popupViewMode: null }),
    SET_READ_ONLY: (state, payload) => ({ ...state, readOnly: payload }),
    OPEN_DELETE_CONFIRM: (state, payload) => ({ ...state, isDeleteConfirmOpen: true, deleteConfirmEvent: payload.event, deleteConfirmType: payload.type || null }),
    CLOSE_DELETE_CONFIRM: (state) => ({ ...state, isDeleteConfirmOpen: false, deleteConfirmEvent: null, deleteConfirmType: null }),
    TRIGGER_RELOAD: (state) => ({ ...state, reloadKey: (state.reloadKey || 0) + 1 }),
};

function normalizeFilterValues(value) {
    const source = Array.isArray(value) ? value.flat(Infinity) : [value];
    const normalized = source
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item && item !== '__manage__');
    const unique = Array.from(new Set(normalized));
    if (unique.length === 0 || unique.includes('all')) return ['all'];
    return unique;
}

/**
 * Toggles the filter state based on the selected payload.
 * Handles switching between 'all' and specific tags, and multi-select logic.
 */
function toggleFilter(filter, payload) {
    if (Array.isArray(payload)) {
        return normalizeFilterValues(payload);
    }

    const nextValue = typeof payload === 'string' ? payload.toLowerCase() : payload;
    if (nextValue === 'all') return ['all'];

    const items = new Set(normalizeFilterValues(filter));
    items.delete('all');
    if (items.has(nextValue)) {
        items.delete(nextValue);
    } else {
        items.add(nextValue);
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
