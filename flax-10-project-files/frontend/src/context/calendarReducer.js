export const initialState = {
    events: [],
    selectedDate: new Date(),
    viewMode: 'week',  // 'day', 'week', 'month'                                  
    isLoading: false,
    error: null,
};

export function calendarReducer(state, action) {
    switch (action.type) {
        case 'SET_EVENTS':
            return { ...state, events: action.payload, isLoading: false };
        case 'ADD_EVENT':
            return { ...state, events: [...state.events, action.payload] };
        case 'UPDATE_EVENT':
            return handleUpdateEvent(state, action.payload);
        case 'DELETE_EVENT':
            return { ...state, events: state.events.filter(e => e.id !== action.payload) };
        case 'SET_VIEW_MODE':
            return { ...state, viewMode: action.payload };
        case 'SET_SELECTED_DATE':
            return { ...state, selectedDate: action.payload };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        default:
            return state;
    }
}

function handleUpdateEvent(state, updatedEvent) {
    const events = state.events.map(e =>
        e.id === updatedEvent.id ? updatedEvent : e
    );
    return { ...state, events };
}                           