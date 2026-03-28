/**
 * Unit tests for event-resize interactions.
 */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventResize } from '../../../components/calendar/hooks/useEventResize';

const useCalendarMock = vi.fn();
const useConfirmMock = vi.fn();
const useResizeHighlightMock = vi.fn();
const createResizeSessionMock = vi.fn();
const checkOverlapWithConfirmMock = vi.fn();
const extractBaseEventIdMock = vi.fn();
const hasRecurrenceMock = vi.fn();

const baseEvent = {
  id: '123-occ',
  start_time: '2026-03-09T10:00:00.000Z',
  end_time: '2026-03-09T11:00:00.000Z',
};
const eventRef = { current: { offsetHeight: 60 } };

vi.mock('../../../context/CalendarContext', () => ({ useCalendar: () => useCalendarMock() }));
vi.mock('../../../context/ConfirmContext', () => ({ useConfirm: () => useConfirmMock() }));
vi.mock('../../../context/ResizeHighlightContext', () => ({ useResizeHighlight: () => useResizeHighlightMock() }));
vi.mock('../../../components/calendar/utils/resizeUtils', () => ({ createResizeSession: (...args) => createResizeSessionMock(...args) }));
vi.mock('../../../components/calendar/utils/overlapUtils', () => ({ checkOverlapWithConfirm: (...args) => checkOverlapWithConfirmMock(...args) }));
vi.mock('../../../components/calendar/utils/eventUtils', () => ({
  extractBaseEventId: (...args) => extractBaseEventIdMock(...args),
  hasRecurrence: (...args) => hasRecurrenceMock(...args),
}));

describe('useEventResize', () => {
  let captured;
  let editEvent;
  let confirmFn;
  let setResizeHighlight;

  beforeEach(() => {
    vi.clearAllMocks();
    captured = null;
    editEvent = vi.fn().mockResolvedValue(undefined);
    confirmFn = vi.fn().mockResolvedValue(true);
    setResizeHighlight = vi.fn();

    useCalendarMock.mockReturnValue({
      events: [{ id: 99 }, { id: 123 }, { id: 200 }],
    });
    useConfirmMock.mockReturnValue(confirmFn);
    useResizeHighlightMock.mockReturnValue({ setResizeHighlight });
    createResizeSessionMock.mockImplementation((clientY, initialHeight, handlers) => {
      captured = { clientY, initialHeight, ...handlers };
    });
    checkOverlapWithConfirmMock.mockResolvedValue(true);
    extractBaseEventIdMock.mockImplementation((id) => Number(String(id).split('-')[0]));
    hasRecurrenceMock.mockReturnValue(false);
  });

  it('starts resize session and updates preview/highlight', async () => {
    const stopPropagation = vi.fn();
    const resizeJustEnded = { current: false };
    const { result } = renderHook(() => useEventResize(baseEvent, eventRef, editEvent, resizeJustEnded));

    await act(async () => {
      result.current.handleResizeStart({ clientY: 400, stopPropagation });
    });
    expect(stopPropagation).toHaveBeenCalled();

    await act(async () => {
      captured.onMove(93);
    });
    expect(result.current.resizePreview).toBeTypeOf('number');
    expect(setResizeHighlight).toHaveBeenCalledWith(expect.objectContaining({ hour: expect.any(Number), quarter: expect.any(Number) }));
  });

  it('updates event on drag end when overlap check passes', async () => {
    const resizeJustEnded = { current: false };
    const { result } = renderHook(() => useEventResize(baseEvent, eventRef, editEvent, resizeJustEnded));

    await act(async () => {
      result.current.handleResizeStart({ clientY: 400, stopPropagation: vi.fn() });
      await captured.onEnd(30);
    });
    expect(checkOverlapWithConfirmMock).toHaveBeenCalled();
    expect(editEvent).toHaveBeenCalledWith(123, expect.objectContaining({ end_time: expect.any(String) }));
    expect(resizeJustEnded.current).toBe(true);
    expect(result.current.isResizing).toBe(false);
    expect(result.current.resizePreview).toBe(null);
    expect(setResizeHighlight).toHaveBeenLastCalledWith(null);
  });

  it('does not edit event when overlap check fails', async () => {
    checkOverlapWithConfirmMock.mockResolvedValue(false);
    const { result } = renderHook(() => useEventResize(baseEvent, eventRef, editEvent, { current: false }));

    await act(async () => {
      result.current.handleResizeStart({ clientY: 200, stopPropagation: vi.fn() });
      await captured.onEnd(20);
    });
    expect(editEvent).not.toHaveBeenCalled();
  });

  it('handles recurring events and cancels when confirm declines', async () => {
    hasRecurrenceMock.mockReturnValue(true);
    confirmFn.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useEventResize(
        { id: '55-occ', start_time: '2026-03-09T08:00:00.000Z', end_time: '2026-03-09T09:00:00.000Z' },
        { current: { offsetHeight: 60 } },
        editEvent,
        { current: false },
      ),
    );

    await act(async () => {
      result.current.handleResizeStart({ clientY: 150, stopPropagation: vi.fn() });
      await captured.onEnd(30);
    });
    expect(confirmFn).toHaveBeenCalled();
    expect(editEvent).not.toHaveBeenCalled();
  });

  it('handles recurring events when confirm accepts', async () => {
    hasRecurrenceMock.mockReturnValue(true);
    confirmFn.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useEventResize(
        { id: '77-occ', start_time: '2026-03-09T08:00:00.000Z', end_time: '2026-03-09T09:00:00.000Z' },
        { current: { offsetHeight: 60 } },
        editEvent,
        { current: false },
      ),
    );

    await act(async () => {
      result.current.handleResizeStart({ clientY: 100, stopPropagation: vi.fn() });
      await captured.onEnd(30);
    });
    expect(confirmFn).toHaveBeenCalled();
    expect(editEvent).toHaveBeenCalledWith(77, expect.objectContaining({ end_time: expect.any(String) }));
  });

  it('skips the resize-ended marker when no ref is provided', async () => {
    const { result } = renderHook(() => useEventResize(baseEvent, eventRef, editEvent));

    await act(async () => {
      result.current.handleResizeStart({ clientY: 120, stopPropagation: vi.fn() });
      await captured.onEnd(30);
    });

    expect(editEvent).toHaveBeenCalledWith(123, expect.objectContaining({ end_time: expect.any(String) }));
  });
});
