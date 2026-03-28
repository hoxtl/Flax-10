import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickOutside } from '../../../components/calendar/event_detail_popup/useClickOutside';

describe('useClickOutside', () => {
    it('calls onClose when clicking outside the ref element', () => {
        const onClose = vi.fn();
        const ref = { current: document.createElement('div') };
        document.body.appendChild(ref.current);

        renderHook(() => useClickOutside(ref, onClose));

        // Click outside (on body)
        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(onClose).toHaveBeenCalledTimes(1);

        document.body.removeChild(ref.current);
    });

    it('does not call onClose when clicking inside the ref element', () => {
        const onClose = vi.fn();
        const div = document.createElement('div');
        document.body.appendChild(div);
        const ref = { current: div };

        renderHook(() => useClickOutside(ref, onClose));

        div.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(onClose).not.toHaveBeenCalled();

        document.body.removeChild(div);
    });

    it('removes event listener on unmount', () => {
        const onClose = vi.fn();
        const ref = { current: document.createElement('div') };
        const removeSpy = vi.spyOn(document, 'removeEventListener');

        const { unmount } = renderHook(() => useClickOutside(ref, onClose));
        unmount();

        expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
        removeSpy.mockRestore();
    });

    it('does not register when the ref is missing and ignores clicks after the element disappears', () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const onClose = vi.fn();
        const { rerender } = renderHook(({ ref, handler }) => useClickOutside(ref, handler), {
            initialProps: { ref: { current: null }, handler: onClose },
        });

        expect(addSpy).not.toHaveBeenCalledWith('mousedown', expect.any(Function));

        const div = document.createElement('div');
        document.body.appendChild(div);
        const ref = { current: div };
        rerender({ ref, handler: onClose });
        ref.current = null;

        document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        expect(onClose).not.toHaveBeenCalled();

        addSpy.mockRestore();
        document.body.removeChild(div);
    });
});
