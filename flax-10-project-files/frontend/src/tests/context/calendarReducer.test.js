import { describe, it, expect } from 'vitest';
import { calendarReducer, initialState } from '../../context/calendarReducer';

describe('calendarReducer', () => {
    it('should return initial state for unknown action', () => {
        const action = { type: 'UNKNOWN' };
        const newState = calendarReducer(initialState, action);
        expect(newState).toBe(initialState);
    });

    it('should handle SET_EVENTS', () => {
        const events = [{ id: 1, title: 'Test' }];
        const action = { type: 'SET_EVENTS', payload: events };
        const newState = calendarReducer(initialState, action);
        expect(newState.events).toEqual(events);
        expect(newState.isLoading).toBe(false);
    });

    it('should handle ADD_EVENT', () => {
        const event = { id: 1, title: 'New' };
        const action = { type: 'ADD_EVENT', payload: event };
        const newState = calendarReducer(initialState, action);
        expect(newState.events).toHaveLength(1);
        expect(newState.events[0]).toEqual(event);
    });

    it('should handle UPDATE_EVENT', () => {
        const initialWithEvent = { ...initialState, events: [{ id: 1, title: 'Old' }] };
        const updated = { id: 1, title: 'New' };
        const action = { type: 'UPDATE_EVENT', payload: updated };
        const newState = calendarReducer(initialWithEvent, action);
        expect(newState.events[0].title).toBe('New');
    });

    it('should handle DELETE_EVENT', () => {
        const initialWithEvent = { ...initialState, events: [{ id: 1, title: 'Delete me' }] };
        const action = { type: 'DELETE_EVENT', payload: 1 };
        const newState = calendarReducer(initialWithEvent, action);
        expect(newState.events).toHaveLength(0);
    });

    it('should handle SET_VIEW_MODE', () => {
        const action = { type: 'SET_VIEW_MODE', payload: 'month' };
        const newState = calendarReducer(initialState, action);
        expect(newState.viewMode).toBe('month');
    });

    it('should handle SET_SELECTED_DATE', () => {
        const date = new Date(2026, 1, 1);
        const action = { type: 'SET_SELECTED_DATE', payload: date };
        const newState = calendarReducer(initialState, action);
        expect(newState.selectedDate).toBe(date);
    });

    it('should handle SET_DISPLAY_MODE', () => {
        const action = { type: 'SET_DISPLAY_MODE', payload: 'agenda' };
        const newState = calendarReducer(initialState, action);
        expect(newState.displayMode).toBe('agenda');
    });

    it('should handle OPEN_MODAL with event', () => {
        const event = { id: 1 };
        const action = { type: 'OPEN_MODAL', payload: { event, type: 'edit' } };
        const newState = calendarReducer(initialState, action);
        expect(newState.isModalOpen).toBe(true);
        expect(newState.modalEvent).toEqual(event);
        expect(newState.modalType).toBe('edit');
    });

    it('should handle OPEN_MODAL without event (create)', () => {
        const action = { type: 'OPEN_MODAL', payload: { event: null, type: 'create' } };
        const newState = calendarReducer(initialState, action);
        expect(newState.isModalOpen).toBe(true);
        expect(newState.modalEvent).toBeNull();
        expect(newState.modalType).toBe('create');
    });
    it('should handle SET_LOADING', () => {
        const action = { type: 'SET_LOADING', payload: true };
        const newState = calendarReducer(initialState, action);
        expect(newState.isLoading).toBe(true);
    });

    it('should handle SET_ERROR', () => {
        const error = 'Something went wrong';
        const action = { type: 'SET_ERROR', payload: error };
        const newState = calendarReducer(initialState, action);
        expect(newState.error).toBe(error);
        expect(newState.isLoading).toBe(false);
    });

    it('should handle OPEN_MODAL with direct payload (legacy/fallback)', () => {
        // payload without event property
        const payload = { id: 1, title: 'Event' };
        const action = { type: 'OPEN_MODAL', payload };
        const newState = calendarReducer(initialState, action);
        expect(newState.isModalOpen).toBe(true);
        expect(newState.modalEvent).toEqual(payload);
        expect(newState.modalType).toBeNull();
    });

    it('should handle UPDATE_EVENT with multiple events', () => {
        const events = [{ id: 1, title: 'Keep' }, { id: 2, title: 'Old' }];
        const initialWithEvents = { ...initialState, events };
        const updated = { id: 2, title: 'New' };
        const action = { type: 'UPDATE_EVENT', payload: updated };
        const newState = calendarReducer(initialWithEvents, action);
        expect(newState.events[0].title).toBe('Keep');
        expect(newState.events[1].title).toBe('New');
    });

    it('should handle OPEN_MODAL with event but no type (defaults null)', () => {
        const event = { id: 1 };
        const action = { type: 'OPEN_MODAL', payload: { event } };
        const newState = calendarReducer(initialState, action);
        expect(newState.modalType).toBeNull();
    });

    it('should handle CLOSE_MODAL', () => {
        const openState = { ...initialState, isModalOpen: true, modalEvent: {}, modalType: 'edit' };
        const action = { type: 'CLOSE_MODAL' };
        const newState = calendarReducer(openState, action);
        expect(newState.isModalOpen).toBe(false);
        expect(newState.modalEvent).toBeNull();
        expect(newState.modalType).toBeNull();
    });

    // Test filtering logic
    it('should handle SET_FILTER (toggle)', () => {
        let state = calendarReducer(initialState, { type: 'SET_FILTER', payload: 'work' });
        expect(state.filter).toEqual(['work']);
        state = calendarReducer(state, { type: 'SET_FILTER', payload: 'study' });
        expect(state.filter).toEqual(['work', 'study']);
        state = calendarReducer(state, { type: 'SET_FILTER', payload: 'work' });
        expect(state.filter).toEqual(['study']);
        state = calendarReducer(state, { type: 'SET_FILTER', payload: 'study' });
        expect(state.filter).toEqual(['all']);
    });

    it('should handle SET_FILTER to all', () => {
        const workState = { ...initialState, filter: ['work', 'study'] };
        const state = calendarReducer(workState, { type: 'SET_FILTER', payload: 'all' });
        expect(state.filter).toEqual(['all']);
    });

    it('should handle SET_FILTER with multi-select array payload', () => {
        const state = calendarReducer(initialState, { type: 'SET_FILTER', payload: ['lecture', 'exam'] });
        expect(state.filter).toEqual(['lecture', 'exam']);
    });

    it('should normalize mixed-case and nested SET_FILTER payloads', () => {
        const state = calendarReducer(initialState, { type: 'SET_FILTER', payload: [['Lecture'], 'EXAM', ' lecture '] });
        expect(state.filter).toEqual(['lecture', 'exam']);
    });

    it('should handle OPEN_POPUP', () => {
        const event = { id: 1, title: 'Pop' };
        const rect = { top: 10, left: 20 };
        const state = calendarReducer(initialState, { type: 'OPEN_POPUP', payload: { event, anchorRect: rect } });
        expect(state.popupEvent).toEqual(event);
        expect(state.popupAnchorRect).toEqual(rect);
    });

    it('should handle OPEN_POPUP with explicit read-only and override view mode', () => {
        const event = { id: 2, title: 'Read only pop' };
        const rect = { top: 15, left: 25 };
        const state = calendarReducer(initialState, {
            type: 'OPEN_POPUP',
            payload: { event, anchorRect: rect, readOnly: true, viewModeOverride: 'month' },
        });
        expect(state.popupReadOnly).toBe(true);
        expect(state.popupViewMode).toBe('month');
    });

    it('should handle CLOSE_POPUP', () => {
        const openState = { ...initialState, popupEvent: { id: 1 }, popupAnchorRect: {} };
        const state = calendarReducer(openState, { type: 'CLOSE_POPUP' });
        expect(state.popupEvent).toBeNull();
        expect(state.popupAnchorRect).toBeNull();
    });

    it('should handle SET_READ_ONLY', () => {
        const state = calendarReducer(initialState, { type: 'SET_READ_ONLY', payload: true });
        expect(state.readOnly).toBe(true);
    });

    it('should normalize non-string and manage-only filter payloads back to all', () => {
        const state = calendarReducer(initialState, {
            type: 'SET_FILTER',
            payload: [['__manage__'], 7, null],
        });
        expect(state.filter).toEqual(['all']);
    });

    it('should preserve non-string payload values in the filter set', () => {
        let state = calendarReducer(initialState, { type: 'SET_FILTER', payload: 3 });
        expect(state.filter).toEqual([3]);
        state = calendarReducer(state, { type: 'SET_FILTER', payload: 3 });
        expect(state.filter).toEqual([3]);
    });

    it('should normalize scalar filter state values when toggling a string payload', () => {
        const scalarFilterState = { ...initialState, filter: 'work' };
        const state = calendarReducer(scalarFilterState, { type: 'SET_FILTER', payload: 'study' });
        expect(state.filter).toEqual(['work', 'study']);
    });

    it('should handle shared calendar and delete confirm branches', () => {
        const sharedState = calendarReducer(initialState, { type: 'SET_SHARED_CALENDAR_VIEW', payload: { userId: 99, userName: 'Casey' } });
        expect(sharedState.sharedCalendarUserId).toBe(99);
        expect(sharedState.sharedCalendarName).toBe('Casey');

        const resetSharedState = calendarReducer(sharedState, { type: 'SET_SHARED_CALENDAR_VIEW', payload: null });
        expect(resetSharedState.sharedCalendarUserId).toBeNull();
        expect(resetSharedState.sharedCalendarName).toBe('');

        const deleteState = calendarReducer(initialState, { type: 'OPEN_DELETE_CONFIRM', payload: { event: { id: 10 } } });
        expect(deleteState.isDeleteConfirmOpen).toBe(true);
        expect(deleteState.deleteConfirmType).toBeNull();

        const closedState = calendarReducer(deleteState, { type: 'CLOSE_DELETE_CONFIRM' });
        expect(closedState.isDeleteConfirmOpen).toBe(false);
        expect(closedState.deleteConfirmEvent).toBeNull();
    });

    it('should handle SET_SEARCH_QUERY', () => {
        const state = calendarReducer(initialState, { type: 'SET_SEARCH_QUERY', payload: 'essay' });
        expect(state.searchQuery).toBe('essay');
    });

    it('should handle TRIGGER_RELOAD', () => {
        const state = calendarReducer(initialState, { type: 'TRIGGER_RELOAD' });
        expect(state.reloadKey).toBe(1);
        const state2 = calendarReducer(state, { type: 'TRIGGER_RELOAD' });
        expect(state2.reloadKey).toBe(2);
    });

    // Test openModalHandler edge cases
    it('should handle OPEN_MODAL with complex payload', () => {
        const event = { id: 1 };
        const date = new Date(2026, 1, 1);
        const action = {
            type: 'OPEN_MODAL',
            payload: {
                event,
                type: 'edit',
                initialDate: date
            }
        };
        const newState = calendarReducer(initialState, action);
        expect(newState.modalEvent).toEqual(event);
        expect(newState.modalType).toBe('edit');
        expect(newState.modalInitialDate).toBe(date);
    });
});
