/**
 * Shared mocks and fixtures for Calendar component tests.
 * Provides reusable mock factories and test data.
 */
import { vi } from 'vitest';

// Mock event factory
export function createMockEvent(overrides = {}) {
    return {
        id: 1,
        title: 'Test Event',
        description: '',
        location: '',
        start_time: '2026-03-15T10:00:00Z',
        end_time: '2026-03-15T11:00:00Z',
        tag: null,
        recurrence: 'none',
        reminder: [],
        all_day: false,
        ...overrides,
    };
}

// Mock tag factory
export function createMockTag(overrides = {}) {
    return { id: 1, label: 'Work', color: '#7B6751', ...overrides };
}

// Standard mock tags
export const mockTags = [
    createMockTag({ id: 1, label: 'Work', color: '#7B6751' }),
    createMockTag({ id: 2, label: 'Other', color: '#9a8778' }),
];

// Mock calendar context state
export function createMockCalendarState(overrides = {}) {
    return {
        events: [],
        selectedDate: new Date(2026, 2, 15),
        viewMode: 'month',
        displayMode: 'calendar',
        searchQuery: '',
        ...overrides,
    };
}

// Mock dispatch factory
export function createMockDispatch() {
    return vi.fn();
}

// Mock event actions factory
export function createMockEventActions() {
    return {
        addEvent: vi.fn(),
        editEvent: vi.fn(),
        removeEvent: vi.fn(),
        addException: vi.fn(),
    };
}

// Mock form logic factory for EventModal tests
export function createMockFormLogic(overrides = {}) {
    return {
        isEditing: false,
        form: { title: '', description: '', tag: '', start_time: '', end_time: '', reminder: [] },
        setForm: vi.fn(),
        error: null,
        handleSubmit: vi.fn(e => e?.preventDefault?.()),
        handleDelete: vi.fn(),
        ...overrides,
    };
}

// Mock ref factory for scroll/DOM tests
export function createMockRef(element = {}) {
    return { current: { scrollTop: 0, scrollLeft: 0, getBoundingClientRect: () => ({ top: 0, left: 0, width: 100, height: 100 }), ...element } };
}

// RAF mock setup helper
export function setupRAFMock() {
    let callback;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => { callback = cb; return 1; });
    return () => callback?.();
}

// Time mock helper
export function mockTime(date) {
    vi.useFakeTimers();
    vi.setSystemTime(date);
    return () => vi.useRealTimers();
}
