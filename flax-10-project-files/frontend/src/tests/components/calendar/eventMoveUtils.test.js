/**
 * Tests for eventMoveUtils - shared helpers for drag-moving calendar events.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    confirmRecurringMove,
    buildMovedEvent,
    getOccurrenceDateString,
    applyMovedEvent,
    applyEventMoveWindow,
    applyCalculatedEventMove,
    handleRecurringMoveChoice,
    moveSingleOccurrenceToWindow,
} from '../../../components/calendar/hooks/eventMoveUtils';

vi.mock('../../../components/calendar/utils/overlapUtils', () => ({
    checkOverlapWithConfirm: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../../components/calendar/utils/eventUtils', () => ({
    extractBaseEventId: vi.fn((id) => {
        if (typeof id === 'string') return parseInt(id.split('-')[0]) || id;
        return id;
    }),
}));

const { checkOverlapWithConfirm } = await import('../../../components/calendar/utils/overlapUtils');
const { extractBaseEventId } = await import('../../../components/calendar/utils/eventUtils');

const makeEvent = (overrides = {}) => ({
    id: 1,
    title: 'Test',
    description: 'desc',
    location: 'Room 1',
    start_time: '2026-03-15T10:00:00Z',
    end_time: '2026-03-15T11:00:00Z',
    ...overrides,
});

describe('confirmRecurringMove', () => {
    it('calls confirmFn with recurring move options', async () => {
        const confirmFn = vi.fn().mockResolvedValue(true);
        const result = await confirmRecurringMove(confirmFn);
        expect(confirmFn).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Recurring Event',
            confirmText: 'Move ALL',
            cancelText: 'Move ONLY this',
        }));
        expect(result).toBe(true);
    });

    it('returns false when user cancels', async () => {
        const confirmFn = vi.fn().mockResolvedValue(false);
        const result = await confirmRecurringMove(confirmFn);
        expect(result).toBe(false);
    });
});

describe('buildMovedEvent', () => {
    it('builds event data from event and new times', () => {
        const event = makeEvent();
        const newStart = new Date('2026-03-16T09:00:00Z');
        const newEnd = new Date('2026-03-16T10:00:00Z');
        const result = buildMovedEvent(event, newStart, newEnd);
        expect(result).toEqual({
            title: 'Test',
            description: 'desc',
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
            location: 'Room 1',
        });
    });

    it('uses empty string when description is falsy', () => {
        const event = makeEvent({ description: null });
        const result = buildMovedEvent(event, new Date(), new Date());
        expect(result.description).toBe('');
    });

    it('uses empty string when location is falsy', () => {
        const event = makeEvent({ location: null });
        const result = buildMovedEvent(event, new Date(), new Date());
        expect(result.location).toBe('');
    });
});

describe('getOccurrenceDateString', () => {
    it('returns YYYY-MM-DD string from datetime', () => {
        expect(getOccurrenceDateString('2026-03-15T10:00:00Z')).toBe('2026-03-15');
    });

    it('handles Date object', () => {
        expect(getOccurrenceDateString(new Date('2026-03-15T00:00:00Z'))).toBe('2026-03-15');
    });
});

describe('applyMovedEvent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkOverlapWithConfirm.mockResolvedValue(true);
        extractBaseEventId.mockImplementation((id) => {
            if (typeof id === 'string') return parseInt(id.split('-')[0]) || id;
            return id;
        });
    });

    it('edits event and returns true when no overlap', async () => {
        const event = makeEvent({ id: 5 });
        const updateData = { start_time: '2026-03-16T09:00:00Z', end_time: '2026-03-16T10:00:00Z' };
        const editEvent = vi.fn().mockResolvedValue({});
        const confirmFn = vi.fn();
        const result = await applyMovedEvent(event, updateData, editEvent, [], confirmFn);
        expect(editEvent).toHaveBeenCalledWith(5, updateData);
        expect(result).toBe(true);
    });

    it('returns false when overlap check fails', async () => {
        checkOverlapWithConfirm.mockResolvedValue(false);
        const event = makeEvent({ id: 5 });
        const editEvent = vi.fn();
        const result = await applyMovedEvent(event, {}, editEvent, [], vi.fn());
        expect(editEvent).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });

    it('filters out same event from others during overlap check', async () => {
        const event = makeEvent({ id: 5 });
        const others = [makeEvent({ id: 5 }), makeEvent({ id: 6 })];
        const editEvent = vi.fn().mockResolvedValue({});
        await applyMovedEvent(event, {}, editEvent, others, vi.fn());
        // checkOverlapWithConfirm should be called with only the non-same event
        expect(checkOverlapWithConfirm).toHaveBeenCalledWith(
            expect.anything(),
            expect.arrayContaining([expect.objectContaining({ id: 6 })]),
            expect.anything()
        );
    });
});

describe('applyEventMoveWindow', () => {
    it('calls applyMovedEvent with new times', async () => {
        checkOverlapWithConfirm.mockResolvedValue(true);
        const event = makeEvent({ id: 3 });
        const newStart = new Date('2026-03-16T09:00:00Z');
        const newEnd = new Date('2026-03-16T10:00:00Z');
        const editEvent = vi.fn().mockResolvedValue({});
        const result = await applyEventMoveWindow(event, newStart, newEnd, editEvent, [], vi.fn());
        expect(result).toBe(true);
        expect(editEvent).toHaveBeenCalledWith(3, {
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
        });
    });
});

describe('applyCalculatedEventMove', () => {
    it('calls createWindow with event and applies result', async () => {
        checkOverlapWithConfirm.mockResolvedValue(true);
        const event = makeEvent({ id: 4 });
        const newStart = new Date('2026-03-16T09:00:00Z');
        const newEnd = new Date('2026-03-16T10:00:00Z');
        const createWindow = vi.fn().mockReturnValue({ newStart, newEnd });
        const editEvent = vi.fn().mockResolvedValue({});
        await applyCalculatedEventMove(event, createWindow, editEvent, [], vi.fn());
        expect(createWindow).toHaveBeenCalledWith(event);
        expect(editEvent).toHaveBeenCalled();
    });
});

describe('handleRecurringMoveChoice', () => {
    it('calls moveAll when user confirms', async () => {
        const confirmFn = vi.fn().mockResolvedValue(true);
        const moveAll = vi.fn().mockResolvedValue('all');
        const moveSingle = vi.fn();
        const result = await handleRecurringMoveChoice(confirmFn, moveAll, moveSingle);
        expect(moveAll).toHaveBeenCalled();
        expect(moveSingle).not.toHaveBeenCalled();
        expect(result).toBe('all');
    });

    it('calls moveSingle when user declines', async () => {
        const confirmFn = vi.fn().mockResolvedValue(false);
        const moveAll = vi.fn();
        const moveSingle = vi.fn().mockResolvedValue('single');
        const result = await handleRecurringMoveChoice(confirmFn, moveAll, moveSingle);
        expect(moveSingle).toHaveBeenCalled();
        expect(moveAll).not.toHaveBeenCalled();
        expect(result).toBe('single');
    });
});

describe('moveSingleOccurrenceToWindow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        checkOverlapWithConfirm.mockResolvedValue(true);
        extractBaseEventId.mockReturnValue(7);
    });

    it('adds exception and new event when no overlap', async () => {
        const event = makeEvent({ id: 7, start_time: '2026-03-15T10:00:00Z', end_time: '2026-03-15T11:00:00Z' });
        const newStart = new Date('2026-03-16T09:00:00Z');
        const newEnd = new Date('2026-03-16T10:00:00Z');
        const createWindow = vi.fn().mockReturnValue({ newStart, newEnd });
        const addEvent = vi.fn().mockResolvedValue({});
        const addException = vi.fn().mockResolvedValue({});
        const result = await moveSingleOccurrenceToWindow(event, createWindow, addEvent, addException, [], vi.fn());
        expect(addException).toHaveBeenCalledWith(7, '2026-03-15');
        expect(addEvent).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Test',
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
        }));
        expect(result).toBe(true);
    });

    it('returns false and does not add when overlap check fails', async () => {
        checkOverlapWithConfirm.mockResolvedValue(false);
        const event = makeEvent({ id: 7 });
        const createWindow = vi.fn().mockReturnValue({
            newStart: new Date('2026-03-16T09:00:00Z'),
            newEnd: new Date('2026-03-16T10:00:00Z'),
        });
        const addEvent = vi.fn();
        const addException = vi.fn();
        const result = await moveSingleOccurrenceToWindow(event, createWindow, addEvent, addException, [], vi.fn());
        expect(addEvent).not.toHaveBeenCalled();
        expect(addException).not.toHaveBeenCalled();
        expect(result).toBe(false);
    });
});
