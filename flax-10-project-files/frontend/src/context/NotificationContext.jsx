import { createContext, useContext, useReducer, useEffect } from 'react';

const NotificationContext = createContext(null);

const getInitialState = () => {
    try {
        const saved = localStorage.getItem('notifications');
        return saved ? JSON.parse(saved) : { notifications: [], isOpen: false, hasUnread: false };
    } catch (e) {
        return { notifications: [], isOpen: false, hasUnread: false };
    }
};

export function NotificationProvider({ children }) {
    const [state, dispatch] = useReducer(notificationReducer, null, getInitialState);

    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(state));
    }, [state]);

    const actions = buildActions(dispatch);

    return (
        <NotificationContext.Provider value={{ ...state, ...actions }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within NotificationProvider');
    return context;
}

function buildActions(dispatch) {
    return {
        addNotification: (n) => dispatch({ type: 'ADD_NOTIFICATION', payload: n }),
        dismissNotification: (id) => dispatch({ type: 'DISMISS_NOTIFICATION', payload: id }),
        markAllRead: () => dispatch({ type: 'MARK_ALL_READ' }),
        togglePanel: () => dispatch({ type: 'TOGGLE_PANEL' }),
        closePanel: () => dispatch({ type: 'CLOSE_PANEL' }),
    };
}

function notificationReducer(state, action) {
    switch (action.type) {
        case 'ADD_NOTIFICATION': return addNotification(state, action.payload);
        case 'DISMISS_NOTIFICATION': return dismissNotification(state, action.payload);
        case 'MARK_ALL_READ': return markAllRead(state);
        case 'TOGGLE_PANEL': return { ...state, isOpen: !state.isOpen };
        case 'CLOSE_PANEL': return { ...state, isOpen: false };
        default: return state;
    }
}

function markAllRead(state) {
    const notifications = state.notifications.map(n => ({ ...n, read: true }));
    return { ...state, notifications, hasUnread: false };
}

function addNotification(state, notification) {
    const newNotification = {
        id: Date.now(),
        timestamp: new Date(),
        read: false,
        ...notification,
    };
    return {
        ...state,
        notifications: [newNotification, ...state.notifications],
        hasUnread: true,
    };
}

function dismissNotification(state, id) {
    const notifications = state.notifications.filter(n => n.id !== id);
    const hasUnread = notifications.some(n => !n.read);
    return {
        ...state,
        notifications,
        hasUnread
    };
}
