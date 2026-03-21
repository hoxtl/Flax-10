import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCalendarEvents, useEventActions } from '../../components/calendar/hooks/useCalendarEvents';

const useCalendarMock = vi.fn();
const useCalendarDispatchMock = vi.fn();
const getEventsMock = vi.fn();
const createEventMock = vi.fn();
const updateEventMock = vi.fn();
const deleteEventMock = vi.fn();
const addExceptionDateMock = vi.fn();
const getDateRangeForViewMock = vi.fn();

vi.mock('../../context/CalendarContext', () => ({
  useCalendar: () => useCalendarMock(),
  useCalendarDispatch: () => useCalendarDispatchMock(),
}));

vi.mock('../../api/eventApi', () => ({
  getEvents: (...args) => getEventsMock(...args),
  createEvent: (...args) => createEventMock(...args),
  updateEvent: (...args) => updateEventMock(...args),
  deleteEvent: (...args) => deleteEventMock(...args),
  addExceptionDate: (...args) => addExceptionDateMock(...args),
}));

vi.mock('../../components/calendar/hooks/calendarHelpers', () => ({
  getDateRangeForView: (...args) => getDateRangeForViewMock(...args),
}));

describe('useCalendarEvents', () => {
  let dispatch;
  let monthOffset = 0;

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
<<<<<<< HEAD
      sharedCalendarUserId: null,
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
});
