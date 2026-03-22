/**
 * Tests for useTableEdit - inline cell editing for table view.
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTableEdit } from '../../../../components/Calendar/hooks/useTableEdit';
import { createMockEvent, createMockDispatch, mockTags } from '../mocks/calendarMocks';

const mockDispatch = createMockDispatch();

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendarDispatch: () => mockDispatch,
}));

vi.mock('../../../../api/calendar/eventApi', () => ({
    updateEvent: vi.fn().mockResolvedValue({}),
}));

describe('useTableEdit', () => {
    const events = [createMockEvent({ id: 1, title: 'Test' })];

    beforeEach(() => vi.clearAllMocks());

    it('initializes with no editing cell', () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        expect(result.current.editingCell).toBeNull();
        expect(result.current.cellValue).toBe('');
    });

    it('startEdit sets editing cell and values', () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'title', 'Test'));
        expect(result.current.editingCell).toEqual({ eventId: 1, field: 'title' });
        expect(result.current.cellValue).toBe('Test');
    });

    it('updateValue changes cell value', () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'title', 'Test'));
        act(() => result.current.updateValue('Updated'));
        expect(result.current.cellValue).toBe('Updated');
    });

    it('cancelEdit clears editing state', () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'title', 'Test'));
        act(() => result.current.cancelEdit());
        expect(result.current.editingCell).toBeNull();
        expect(result.current.cellValue).toBe('');
    });

    it('saveEdit updates event when value changed', async () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'title', 'Test'));
        act(() => result.current.updateValue('New Title'));
        await act(async () => result.current.saveEdit());
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_EVENT', payload: expect.objectContaining({ title: 'New Title' }) });
    });

    it('saveEdit does nothing when value unchanged', async () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'title', 'Test'));
        await act(async () => result.current.saveEdit());
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('saveEdit cancels when event not found', async () => {
        const { result } = renderHook(() => useTableEdit([], mockTags));
        act(() => result.current.startEdit(999, 'title', 'Test'));
        act(() => result.current.updateValue('New'));
        await act(async () => result.current.saveEdit());
        expect(result.current.editingCell).toBeNull();
    });

    it('saveWithValue saves with provided value', async () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'location', ''));
        await act(async () => result.current.saveWithValue('Room 101'));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_EVENT', payload: expect.objectContaining({ location: 'Room 101' }) });
    });

    it('saveDateTimes updates event times', async () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        await act(async () => result.current.saveDateTimes(1, { start_time: '2026-03-15T09:00', end_time: '2026-03-15T10:00' }));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_EVENT', payload: expect.objectContaining({ start_time: '2026-03-15T09:00' }) });
    });

    it('saveDateTimes does nothing when event not found', async () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        await act(async () => result.current.saveDateTimes(999, { start_time: '2026-03-15T09:00', end_time: '2026-03-15T10:00' }));
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('handles tag field update correctly', async () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'tag', null));
        await act(async () => result.current.saveWithValue(1));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_EVENT', payload: expect.objectContaining({ tag: 1, tag_name: 'Work' }) });
    });

    it('handles description field update', async () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'description', ''));
        act(() => result.current.updateValue('New description'));
        await act(async () => result.current.saveEdit());
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'UPDATE_EVENT', payload: expect.objectContaining({ description: 'New description' }) });
    });

    it('handles null value in startEdit', () => {
        const { result } = renderHook(() => useTableEdit(events, mockTags));
        act(() => result.current.startEdit(1, 'location', null));
        expect(result.current.cellValue).toBe('');
    });
});
