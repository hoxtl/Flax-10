import { describe, it, expect, beforeEach } from 'vitest';
import { usePopupPosition } from '../../components/calendar/event_detail_popup/usePopupPosition';

describe('usePopupPosition', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    });

    it('returns centered position when anchorRect is null', () => {
        const pos = usePopupPosition(null);
        expect(pos.top).toBe('50%');
        expect(pos.left).toBe('50%');
        expect(pos.transform).toBe('translate(-50%, -50%)');
        expect(pos.position).toBe('fixed');
    });

    it('returns anchored position below anchor when space is sufficient', () => {
        const anchorRect = { top: 100, bottom: 150, left: 200 };
        const pos = usePopupPosition(anchorRect);
        // spaceBelow is 650, which is greater than 250, so the popup opens below.
        expect(pos.top).toBe('158px'); // 150 + 8 margin
        expect(pos.transform).toBe('none');
        expect(pos.position).toBe('fixed');
    });

    it('returns position above anchor when space below is insufficient', () => {
        const anchorRect = { top: 650, bottom: 700, left: 200 };
        const pos = usePopupPosition(anchorRect);
        // spaceBelow is 100 and spaceAbove is 650, so the popup opens above.
        expect(pos.top).toBe('642px'); // 650 - 8 margin
        expect(pos.transform).toBe('translateY(-100%)');
    });

    it('clamps left position to margin from right', () => {
        const anchorRect = { top: 100, bottom: 150, left: 1100 };
        const pos = usePopupPosition(anchorRect);
        // Math.min(1100, 1200-380) = Math.min(1100, 820) = 820
        expect(pos.left).toBe('820px');
    });
});
