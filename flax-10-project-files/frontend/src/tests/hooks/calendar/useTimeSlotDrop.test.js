import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimeSlotDrop } from '../../../components/calendar/hooks/useTimeSlotDrop';

const useCalendarMock = vi.fn();
const useEventModalMock = vi.fn();
const useConfirmMock = vi.fn();
const useEventActionsMock = vi.fn();
const useDropMock = vi.fn();
const checkOverlapWithConfirmMock = vi.fn();
const extractBaseEventIdMock = vi.fn();
const hasRecurrenceMock = vi.fn();
const getMinuteOffsetMock = vi.fn();

vi.mock('../../../context/CalendarContext', () => ({
  useCalendar: () => useCalendarMock(),
  useEventModal: () => useEventModalMock(),
}));
vi.mock('../../../context/ConfirmContext', () => ({ useConfirm: () => useConfirmMock() }));
vi.mock('../../../components/calendar/hooks/useCalendarEvents', () => ({ useEventActions: () => useEventActionsMock() }));
vi.mock('../../../components/calendar/hooks/useDragDrop', () => ({ useDrop: (...args) => useDropMock(...args) }));
vi.mock('../../../components/calendar/calendarConstants', () => ({ SLOT_HEIGHT: 80, getMinuteOffset: (...args) => getMinuteOffsetMock(...args) }));
vi.mock('../../../components/calendar/utils/overlapUtils', () => ({ checkOverlapWithConfirm: (...args) => checkOverlapWithConfirmMock(...args) }));
const isReadOnlyEventMock = vi.fn(() => false);
vi.mock('../../../components/calendar/utils/eventUtils', () => ({
  isReadOnlyEvent: vi.fn(() => false),
  extractBaseEventId: (...args) => extractBaseEventIdMock(...args),
  hasRecurrence: (...args) => hasRecurrenceMock(...args),
  isReadOnlyEvent: (...args) => isReadOnlyEventMock(...args),
}));

describe('useTimeSlotDrop', () => {
  let onDrop;
  let openModal;
  let confirmFn;
  let actions;
  let dropProps;

  beforeEach(() => {
    vi.clearAllMocks();
    onDrop = null;
    openModal = vi.fn();
    confirmFn = vi.fn().mockResolvedValue(true);
    actions = { addEvent: vi.fn(), editEvent: vi.fn(), addException: vi.fn() };
    dropProps = { onDragOver: vi.fn(), onDragLeave: vi.fn() };

    useCalendarMock.mockReturnValue({ events: [{ id: 100 }] });
    useEventModalMock.mockReturnValue({ openModal });
    useConfirmMock.mockReturnValue(confirmFn);
    useEventActionsMock.mockReturnValue(actions);
    checkOverlapWithConfirmMock.mockResolvedValue(true);
    extractBaseEventIdMock.mockImplementation((id) => Number(String(id).split('-')[0]) || Number(id));
    hasRecurrenceMock.mockReturnValue(false);
    getMinuteOffsetMock.mockReturnValue(15);

    useDropMock.mockImplementation(({ onDrop: dropHandler }) => {
      onDrop = dropHandler;
      return { dropProps, isOver: true };
    });
  });

  const makeDropEvent = () => ({
    clientY: 120,
    currentTarget: { getBoundingClientRect: () => ({ top: 100 }) },
  });

  function renderTimeSlotDrop(hour = 9, date = '2026-03-10T00:00:00Z') {
    return renderHook(() => useTimeSlotDrop(hour, new Date(date)));
  }

  async function dropOnTimeSlot(data, type) {
    await act(async () => {
      await onDrop({ type, data }, makeDropEvent());
    });
  }

  it('returns merged props and opens modal on click', () => {
    const { result } = renderTimeSlotDrop();

    expect(result.current.isOver).toBe(true);
    expect(result.current.highlightQuarter).toBeNull();

    act(() => {
      result.current.mergedProps.onClick(makeDropEvent());
    });

    expect(openModal).toHaveBeenCalledWith(expect.objectContaining({
      start_time: expect.any(Date),
      end_time: expect.any(Date),
    }));
  });

  it('updates and clears highlight quarter via drag handlers', () => {
    const { result } = renderTimeSlotDrop();

    act(() => {
      result.current.mergedProps.onDragOver({
        clientY: 130,
        currentTarget: { getBoundingClientRect: () => ({ top: 100 }) },
      });
    });

    expect(dropProps.onDragOver).toHaveBeenCalled();
    expect(result.current.highlightQuarter).toBe(1);

    act(() => {
      result.current.mergedProps.onDragLeave({});
    });

    expect(dropProps.onDragLeave).toHaveBeenCalled();
    expect(result.current.highlightQuarter).toBeNull();
  });

  it('handles drag highlight updates even when the drop target omits optional handlers', () => {
    dropProps = {};
    useDropMock.mockImplementation(({ onDrop: dropHandler }) => {
      onDrop = dropHandler;
      return { dropProps, isOver: false };
    });
    const { result } = renderTimeSlotDrop();

    act(() => {
      result.current.mergedProps.onDragOver({
        clientY: 220,
        currentTarget: { getBoundingClientRect: () => ({ top: 100 }) },
      });
    });

    expect(result.current.highlightQuarter).toBe(3);

    act(() => {
      result.current.mergedProps.onDragLeave({});
    });

    expect(result.current.highlightQuarter).toBeNull();
  });

  it('creates event from tag payload when overlap check passes', async () => {
    renderTimeSlotDrop();
    await dropOnTimeSlot({ name: 'Revision', default_duration: 30 }, 'TAG');

    expect(checkOverlapWithConfirmMock).toHaveBeenCalled();
    expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Revision' }));
  });

  it('does not create tag event when overlap check fails', async () => {
    checkOverlapWithConfirmMock.mockResolvedValue(false);
    renderTimeSlotDrop();
    await dropOnTimeSlot({ name: 'Revision' }, 'TAG');

    expect(actions.addEvent).not.toHaveBeenCalled();
  });

  it('ignores unsupported payload types', async () => {
    renderTimeSlotDrop();
    await dropOnTimeSlot({ name: 'Ignored' }, 'UNKNOWN');

    expect(actions.addEvent).not.toHaveBeenCalled();
    expect(actions.editEvent).not.toHaveBeenCalled();
    expect(actions.addException).not.toHaveBeenCalled();
  });

  it('moves non-recurring event with editEvent', async () => {
    hasRecurrenceMock.mockReturnValue(false);
    renderTimeSlotDrop();
    await dropOnTimeSlot({ id: 7, start_time: '2026-03-09T08:00:00Z', end_time: '2026-03-09T09:00:00Z' }, 'EVENT');

    expect(actions.editEvent).toHaveBeenCalledWith(7, expect.objectContaining({ start_time: expect.any(String) }));
  });

  it('moves all recurring events when confirm resolves true', async () => {
    hasRecurrenceMock.mockReturnValue(true);
    confirmFn.mockResolvedValue(true);
    renderTimeSlotDrop();
    await dropOnTimeSlot({ id: '5-occ', start_time: '2026-03-09T08:00:00Z', end_time: '2026-03-09T09:00:00Z' }, 'EVENT');

    expect(confirmFn).toHaveBeenCalled();
    expect(actions.editEvent).toHaveBeenCalledWith(5, expect.any(Object));
    expect(actions.addException).not.toHaveBeenCalled();
    expect(actions.addEvent).not.toHaveBeenCalled();
  });

  it('moves a single recurring occurrence when confirm resolves false', async () => {
    hasRecurrenceMock.mockReturnValue(true);
    confirmFn.mockResolvedValue(false);
    renderTimeSlotDrop();
    await dropOnTimeSlot({
      id: '6-occ',
      title: 'Seminar',
      description: '',
      location: 'A1',
      start_time: '2026-03-09T08:00:00Z',
      end_time: '2026-03-09T09:00:00Z',
    }, 'EVENT');

    expect(actions.addException).toHaveBeenCalledWith(6, '2026-03-09');
    expect(actions.addEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Seminar', location: 'A1' }));
  });

  it('ignores read-only events before any move logic runs', async () => {
    isReadOnlyEventMock.mockReturnValue(true);
    renderTimeSlotDrop();
    await dropOnTimeSlot({ id: 13, start_time: '2026-03-09T08:00:00Z', end_time: '2026-03-09T09:00:00Z' }, 'EVENT');

    expect(actions.addEvent).not.toHaveBeenCalled();
    expect(actions.editEvent).not.toHaveBeenCalled();
    expect(actions.addException).not.toHaveBeenCalled();
    expect(confirmFn).not.toHaveBeenCalled();
  });
});
