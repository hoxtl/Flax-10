/**
 * Tests for useEventPopupListener - event popup via custom events.
 */
<<<<<<< HEAD

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEventPopupListener } from '../../../../components/calendar/hooks/useEventPopupListener';
=======
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEventPopupListener } from '../../../../components/Calendar/hooks/useEventPopupListener';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

const mockOpenPopup = vi.fn();
const mockEvents = [{ id: 1, title: 'Test Event' }, { id: 2, title: 'Other' }];

vi.mock('../../../../context/CalendarContext', () => ({
    useCalendar: () => ({ allEvents: mockEvents }),
    useEventPopup: () => ({ openPopup: mockOpenPopup }),
}));

describe('useEventPopupListener', () => {
    let addSpy, removeSpy;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        addSpy = vi.spyOn(window, 'addEventListener');
        removeSpy = vi.spyOn(window, 'removeEventListener');
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('adds event listener on mount', () => {
        renderHook(() => useEventPopupListener());
        expect(addSpy).toHaveBeenCalledWith('open-event-popup', expect.any(Function));
    });

    it('removes event listener on unmount', () => {
        const { unmount } = renderHook(() => useEventPopupListener());
        unmount();
        expect(removeSpy).toHaveBeenCalledWith('open-event-popup', expect.any(Function));
    });

    it('opens popup when event element found', () => {
        const element = document.createElement('div');
        element.setAttribute('data-event-id', '1');
        element.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 50 });
        element.scrollIntoView = vi.fn();
        document.body.appendChild(element);

        renderHook(() => useEventPopupListener());
        window.dispatchEvent(new CustomEvent('open-event-popup', { detail: { eventId: '1' } }));

        vi.advanceTimersByTime(500);
        expect(mockOpenPopup).toHaveBeenCalled();

        document.body.removeChild(element);
    });

    it('retries finding element up to max attempts', () => {
        renderHook(() => useEventPopupListener());
        window.dispatchEvent(new CustomEvent('open-event-popup', { detail: { eventId: '999' } }));

        for (let i = 0; i < 25; i++) vi.advanceTimersByTime(150);
        expect(mockOpenPopup).not.toHaveBeenCalled();
    });

    it('scrolls element into view before opening popup', () => {
        const scrollMock = vi.fn();
        const element = document.createElement('div');
        element.setAttribute('data-event-id', '2');
        element.getBoundingClientRect = () => ({ top: 0, left: 0, width: 100, height: 50 });
        element.scrollIntoView = scrollMock;
        document.body.appendChild(element);

        renderHook(() => useEventPopupListener());
        window.dispatchEvent(new CustomEvent('open-event-popup', { detail: { eventId: '2' } }));
        vi.advanceTimersByTime(50);

        expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
        document.body.removeChild(element);
    });
});
