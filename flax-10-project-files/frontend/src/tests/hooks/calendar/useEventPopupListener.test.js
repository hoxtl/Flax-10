import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventPopupListener } from '../../../components/calendar/hooks/useEventPopupListener';

const useCalendarMock = vi.fn();
const useEventPopupMock = vi.fn();

vi.mock('../../../context/CalendarContext', () => ({
  useCalendar: () => useCalendarMock(),
  useEventPopup: () => useEventPopupMock(),
}));

describe('useEventPopupListener', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useCalendarMock.mockReturnValue({ allEvents: [{ id: 1, title: 'Test' }] });
    useEventPopupMock.mockReturnValue({ openPopup: vi.fn() });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('registers and unregisters the popup listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useEventPopupListener());
    expect(addSpy).toHaveBeenCalledWith('open-event-popup', expect.any(Function));

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('open-event-popup', expect.any(Function));
  });

  it('opens popup when matching event element exists', () => {
    const openPopup = vi.fn();
    useEventPopupMock.mockReturnValue({ openPopup });

    const el = document.createElement('div');
    el.setAttribute('data-event-id', '1');
    el.scrollIntoView = vi.fn();
    el.getBoundingClientRect = vi.fn(() => ({ top: 10, left: 20 }));
    document.body.appendChild(el);

    renderHook(() => useEventPopupListener());

    window.dispatchEvent(new CustomEvent('open-event-popup', { detail: { eventId: 1 } }));
    vi.advanceTimersByTime(300);

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(openPopup).toHaveBeenCalledWith({ id: 1, title: 'Test' }, { top: 10, left: 20 });
  });

  it('stops retrying when event element is never found', () => {
    const openPopup = vi.fn();
    useEventPopupMock.mockReturnValue({ openPopup });

    renderHook(() => useEventPopupListener());

    window.dispatchEvent(new CustomEvent('open-event-popup', { detail: { eventId: 99 } }));
    vi.advanceTimersByTime(20 * 150 + 300);

    expect(openPopup).not.toHaveBeenCalled();
  });
});
