import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMonthDayDrop } from '../../components/Calendar/hooks/useMonthDayDrop';

const useCalendarMock = vi.fn();
const useConfirmMock = vi.fn();
const useEventActionsMock = vi.fn();
const useDropMock = vi.fn();
const checkOverlapWithConfirmMock = vi.fn();
const extractBaseEventIdMock = vi.fn();
const hasRecurrenceMock = vi.fn();

vi.mock('../../context/CalendarContext', () => ({ useCalendar: () => useCalendarMock() }));
vi.mock('../../context/ConfirmContext', () => ({ useConfirm: () => useConfirmMock() }));
vi.mock('../../components/Calendar/hooks/useCalendarEvents', () => ({ useEventActions: () => useEventActionsMock() }));
vi.mock('../../components/Calendar/hooks/useDragDrop', () => ({ useDrop: (...args) => useDropMock(...args) }));
vi.mock('../../components/Calendar/utils/overlapUtils', () => ({ checkOverlapWithConfirm: (...args) => checkOverlapWithConfirmMock(...args) }));
const isReadOnlyEventMock = vi.fn(() => false);

vi.mock('../../components/Calendar/utils/eventUtils', () => ({
  extractBaseEventId: (...args) => extractBaseEventIdMock(...args),
  hasRecurrence: (...args) => hasRecurrenceMock(...args),
  isReadOnlyEvent: (...args) => isReadOnlyEventMock(...args),
}));

describe('useMonthDayDrop', () => {
  let onDrop;
  let editEvent;
  let addEvent;
  let addException;
  let confirmFn;

  beforeEach(() => {
    vi.clearAllMocks();
    onDrop = null;
    editEvent = vi.fn();
    addEvent = vi.fn();
    addException = vi.fn();
    confirmFn = vi.fn().mockResolvedValue(true);

    useCalendarMock.mockReturnValue({ events: [{ id: 999 }] });
    useConfirmMock.mockReturnValue(confirmFn);
    useEventActionsMock.mockReturnValue({ editEvent, addEvent, addException });
    checkOverlapWithConfirmMock.mockResolvedValue(true);
    extractBaseEventIdMock.mockImplementation((id) => Number(String(id).split('-')[0]) || Number(id));
    hasRecurrenceMock.mockReturnValue(false);

    useDropMock.mockImplementation(({ onDrop: dropHandler }) => {
      onDrop = dropHandler;
      return { dropProps: { 'data-drop': true }, isOver: false };
    });
  });

  it('returns drop props and ignores non-event payloads', async () => {
    const { result } = renderHook(() => useMonthDayDrop(new Date('2026-03-09T00:00:00Z')));

    expect(result.current.dropProps).toEqual({ 'data-drop': true });
    expect(result.current.isOver).toBe(false);

    await onDrop({ type: 'NOT_EVENT', data: {} });
    expect(editEvent).not.toHaveBeenCalled();
    expect(addEvent).not.toHaveBeenCalled();
  });

  it('moves non-recurring event when overlap check passes', async () => {
    hasRecurrenceMock.mockReturnValue(false);
    renderHook(() => useMonthDayDrop(new Date('2026-03-10T00:00:00Z')));

    const event = { id: 42, start_time: '2026-03-09T08:30:00Z', end_time: '2026-03-09T09:30:00Z' };
    await onDrop({ type: 'EVENT', data: event });

    expect(checkOverlapWithConfirmMock).toHaveBeenCalled();
    expect(editEvent).toHaveBeenCalledWith(42, expect.objectContaining({
      start_time: expect.any(String),
      end_time: expect.any(String),
    }));
  });

  it('does not edit event when overlap check fails', async () => {
    checkOverlapWithConfirmMock.mockResolvedValue(false);
    renderHook(() => useMonthDayDrop(new Date('2026-03-10T00:00:00Z')));

    await onDrop({ type: 'EVENT', data: { id: 12, start_time: '2026-03-09T08:00:00Z', end_time: '2026-03-09T09:00:00Z' } });
    expect(editEvent).not.toHaveBeenCalled();
  });

  it('moves all recurring events when confirm resolves true', async () => {
    hasRecurrenceMock.mockReturnValue(true);
    confirmFn.mockResolvedValue(true);
    renderHook(() => useMonthDayDrop(new Date('2026-03-10T00:00:00Z')));

    await onDrop({ type: 'EVENT', data: { id: '5-occ', start_time: '2026-03-09T08:00:00Z', end_time: '2026-03-09T09:00:00Z' } });

    expect(confirmFn).toHaveBeenCalled();
    expect(editEvent).toHaveBeenCalledWith(5, expect.any(Object));
    expect(addException).not.toHaveBeenCalled();
    expect(addEvent).not.toHaveBeenCalled();
  });

  it('moves only one occurrence for recurring event when confirm resolves false', async () => {
    hasRecurrenceMock.mockReturnValue(true);
    confirmFn.mockResolvedValue(false);
    renderHook(() => useMonthDayDrop(new Date('2026-03-10T00:00:00Z')));

    const recurring = {
      id: '7-occ',
      title: 'Lecture',
      description: 'desc',
      location: 'room',
      start_time: '2026-03-09T08:00:00Z',
      end_time: '2026-03-09T09:00:00Z',
    };

    await onDrop({ type: 'EVENT', data: recurring });

    expect(addException).toHaveBeenCalledWith(7, '2026-03-09');
    expect(addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Lecture', location: 'room' }));
    expect(editEvent).not.toHaveBeenCalled();
  });
});
