/*
 * Tests for calendar event loading and mutation hooks.
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCalendarEvents, useEventActions } from '../../../components/calendar/hooks/useCalendarEvents';

const useCalendarMock = vi.fn();
const useCalendarDispatchMock = vi.fn();
const getEventsMock = vi.fn();
const createEventMock = vi.fn();
const updateEventMock = vi.fn();
const deleteEventMock = vi.fn();
const addExceptionDateMock = vi.fn();
const getDateRangeForViewMock = vi.fn();

vi.mock('../../../context/CalendarContext', () => ({
  useCalendar: () => useCalendarMock(),
  useCalendarDispatch: () => useCalendarDispatchMock(),
}));

vi.mock('../../../api/eventApi', () => ({
  getEvents: (...args) => getEventsMock(...args),
  createEvent: (...args) => createEventMock(...args),
  updateEvent: (...args) => updateEventMock(...args),
  deleteEvent: (...args) => deleteEventMock(...args),
  addExceptionDate: (...args) => addExceptionDateMock(...args),
}));

vi.mock('../../../components/calendar/hooks/calendarHelpers', () => ({
  getDateRangeForView: (...args) => getDateRangeForViewMock(...args),
}));

describe('useCalendarEvents', () => {
  let dispatch;
  let monthOffset = 0;
  let pendingDateOffset = 0;

  beforeEach(() => {
    vi.resetAllMocks();
    dispatch = vi.fn();
    const month = 2 + monthOffset; // 0-indexed, start around March
    const year = 2026 + Math.floor(month / 12);
    const normalizedMonth = ((month % 12) + 12) % 12;
    const selectedDate = new Date(year, normalizedMonth, 9).toISOString();
    monthOffset += 1;

    useCalendarMock.mockReturnValue({
      events: [{ id: 1 }],
      selectedDate,
      viewMode: 'month',
      sharedCalendarUserId: null,
    });
    useCalendarDispatchMock.mockReturnValue(dispatch);
    getDateRangeForViewMock.mockReturnValue({ start: '2026-03-01', end: '2026-03-31' });
    getEventsMock.mockResolvedValue([{ id: 2 }]);
    createEventMock.mockResolvedValue({ id: 3 });
    updateEventMock.mockResolvedValue({ id: 4 });
    deleteEventMock.mockResolvedValue({});
    addExceptionDateMock.mockResolvedValue({});
  });

  it('loads events on mount and dispatches loading + events', async () => {
    const { result } = renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_EVENTS', payload: [{ id: 2 }] });
    });

    expect(result.current.events).toEqual([{ id: 1 }]);
    expect(getEventsMock).toHaveBeenCalledWith({ start: '2026-03-01', end: '2026-03-31' });
  });

  it('dispatches error when loadEvents fails', async () => {
    getEventsMock.mockRejectedValueOnce(new Error('boom'));
    renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(dispatch).toHaveBeenCalledWith({ type: 'SET_ERROR', payload: 'boom' });
    });
  });

  it('loads shared calendar events with the viewed user id when present', async () => {
    useCalendarMock.mockReturnValue({
      events: [{ id: 1 }],
      selectedDate: new Date(2026, 2, 9).toISOString(),
      viewMode: 'month',
      sharedCalendarUserId: '42',
    });

    renderHook(() => useCalendarEvents());

    await waitFor(() => {
      expect(getEventsMock).toHaveBeenCalledWith({ start: '2026-03-01', end: '2026-03-31', user_id: '42' });
    });
  });

  it('computes date keys for null, day, week, and year views', async () => {
    const states = [
      { selectedDate: null, viewMode: 'month' },
      { selectedDate: new Date(2026, 2, 9).toISOString(), viewMode: 'day' },
      { selectedDate: new Date(2026, 2, 9).toISOString(), viewMode: 'week' },
      { selectedDate: new Date(2026, 2, 9).toISOString(), viewMode: 'year' },
    ];

    for (let index = 0; index < states.length; index += 1) {
      useCalendarMock.mockReturnValue({
        events: [],
        reloadKey: 0,
        sharedCalendarUserId: null,
        ...states[index],
      });

      const { unmount } = renderHook(() => useCalendarEvents());
      await waitFor(() => expect(getEventsMock).toHaveBeenCalledTimes(index + 1));
      unmount();
    }
  });

  it('skips duplicate fetches for the same date key across mounts', async () => {
    const calendarState = {
      events: [],
      selectedDate: new Date(2026, 6, 9).toISOString(),
      viewMode: 'month',
      reloadKey: 0,
      sharedCalendarUserId: null,
    };
    useCalendarMock.mockImplementation(() => calendarState);

    const first = renderHook(() => useCalendarEvents());
    await waitFor(() => expect(getEventsMock).toHaveBeenCalledTimes(1));
    first.unmount();

    renderHook(() => useCalendarEvents());
    await act(async () => {
      await Promise.resolve();
    });

    expect(getEventsMock).toHaveBeenCalledTimes(1);
  });

  function renderCalendarEventsWithState(calendarState) {
    useCalendarMock.mockImplementation(() => calendarState);
    return renderHook(() => useCalendarEvents());
  }

  function createPendingCalendarState() {
    const selectedDate = new Date(2026, 7 + pendingDateOffset, 9).toISOString();
    pendingDateOffset += 1;
    return {
      events: [],
      selectedDate,
      viewMode: 'month',
      reloadKey: 0,
      sharedCalendarUserId: null,
    };
  }

  it('skips concurrent fetches while an earlier request is still pending', async () => {
    let resolveEvents;
    const pendingEvents = new Promise((resolve) => {
      resolveEvents = resolve;
    });
    let calendarState = createPendingCalendarState();
    getEventsMock.mockReturnValueOnce(pendingEvents).mockResolvedValueOnce([{ id: 20 }]);
    const { rerender, result } = renderCalendarEventsWithState(calendarState);
    await act(async () => {
      await result.current.loadEvents();
    });
    calendarState = { ...calendarState, selectedDate: new Date(2026, 7, 10).toISOString() };
    rerender();
    expect(getEventsMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolveEvents([{ id: 20 }]);
      await pendingEvents;
    });
  });

  it('dispatches the resolved result from a pending request', async () => {
    let resolveEvents;
    const pendingEvents = new Promise((resolve) => {
      resolveEvents = resolve;
    });
    getEventsMock.mockReturnValueOnce(pendingEvents);
    renderCalendarEventsWithState(createPendingCalendarState());
    await act(async () => {
      resolveEvents([{ id: 19 }]);
      await pendingEvents;
    });
    await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'SET_EVENTS', payload: [{ id: 19 }] }));
  });

  it('reloads events when the reload key changes', async () => {
    let calendarState = createPendingCalendarState();
    useCalendarMock.mockImplementation(() => calendarState);
    const { rerender } = renderHook(({ tick }) => {
      void tick;
      return useCalendarEvents();
    }, { initialProps: { tick: 0 } });
    await waitFor(() => expect(getEventsMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'SET_EVENTS', payload: [{ id: 2 }] }));
    calendarState = { ...calendarState, reloadKey: 1 };
    await act(async () => {
      rerender({ tick: 1 });
    });
    await waitFor(() => expect(getEventsMock).toHaveBeenCalledTimes(2));
  });

  it('addEvent creates and reloads events', async () => {
    const { result } = renderHook(() => useEventActions());

    const created = await result.current.addEvent({ title: 'X' });

    expect(created).toEqual({ id: 3 });
    expect(createEventMock).toHaveBeenCalledWith({ title: 'X' });
    expect(getEventsMock).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith({ type: 'SET_EVENTS', payload: [{ id: 2 }] });
  });

  it('editEvent updates and reloads events', async () => {
    const { result } = renderHook(() => useEventActions());

    const updated = await result.current.editEvent(9, { title: 'Y' });

    expect(updated).toEqual({ id: 4 });
    expect(updateEventMock).toHaveBeenCalledWith(9, { title: 'Y' });
    expect(getEventsMock).toHaveBeenCalled();
  });

  it('removeEvent deletes and reloads events', async () => {
    const { result } = renderHook(() => useEventActions());

    await result.current.removeEvent(10);

    expect(deleteEventMock).toHaveBeenCalledWith(10);
    expect(getEventsMock).toHaveBeenCalled();
  });

  it('addException adds date exception and reloads events', async () => {
    const { result } = renderHook(() => useEventActions());

    await result.current.addException(11, '2026-03-10');

    expect(addExceptionDateMock).toHaveBeenCalledWith(11, '2026-03-10');
    expect(getEventsMock).toHaveBeenCalled();
  });

  it('reloads shared-calendar mutations with the viewed user id', async () => {
    useCalendarMock.mockReturnValue({
      selectedDate: new Date(2026, 2, 9).toISOString(),
      viewMode: 'week',
      sharedCalendarUserId: '84',
    });
    const { result } = renderHook(() => useEventActions());

    await act(async () => {
      await result.current.addEvent({ title: 'Shared item' });
    });

    expect(getEventsMock).toHaveBeenCalledWith({ start: '2026-03-01', end: '2026-03-31', user_id: '84' });
  });
});
