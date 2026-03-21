/**
 * Tests for popoverUtils - popover positioning calculations.
 */
import { describe, it, expect } from 'vitest';
import { calculatePopoverPosition, calculateArrowPosition } from '../../../../components/Calendar/EventPopover/popoverUtils';

describe('popoverUtils', () => {
    const anchor = { top: 200, left: 300, right: 350, bottom: 250, width: 50, height: 50 };
    const popWidth = 200;
    const popHeight = 150;
    const winWidth = 1024;
    const winHeight = 768;

    describe('calculatePopoverPosition', () => {
        it('returns default position when no anchor', () => {
            const pos = calculatePopoverPosition(null, popWidth, popHeight, winWidth, winHeight);
            expect(pos).toEqual({ top: 0, left: 0, placement: 'right' });
        });

        it('positions right of anchor by default', () => {
            const pos = calculatePopoverPosition(anchor, popWidth, popHeight, winWidth, winHeight);
            expect(pos.placement).toBe('right');
            expect(pos.left).toBe(anchor.right + 12);
        });

        it('positions left when no room on right', () => {
            const rightEdgeAnchor = { ...anchor, right: winWidth - 50 };
            const pos = calculatePopoverPosition(rightEdgeAnchor, popWidth, popHeight, winWidth, winHeight);
            expect(pos.placement).toBe('left');
        });

        it('uses none placement when no room left or right', () => {
            const narrowWin = 200;
            const pos = calculatePopoverPosition(anchor, popWidth, popHeight, narrowWin, winHeight);
            expect(['left', 'none']).toContain(pos.placement);
        });

        it('positions above in day view', () => {
            const pos = calculatePopoverPosition(anchor, popWidth, popHeight, winWidth, winHeight, null, 'day');
            expect(pos.placement).toBe('top');
        });

        it('positions below in day view when no room above', () => {
            const topAnchor = { ...anchor, top: 50, bottom: 100 };
            const pos = calculatePopoverPosition(topAnchor, popWidth, popHeight, winWidth, winHeight, null, 'day');
            expect(pos.placement).toBe('bottom');
        });

        it('preserves current top position when provided', () => {
            const pos = calculatePopoverPosition(anchor, popWidth, popHeight, winWidth, winHeight, 100);
            expect(pos.top).toBe(100);
        });

        it('clamps position within viewport bounds', () => {
            const bottomAnchor = { ...anchor, top: winHeight - 50 };
            const pos = calculatePopoverPosition(bottomAnchor, popWidth, popHeight, winWidth, winHeight);
            expect(pos.top).toBeLessThanOrEqual(winHeight - popHeight - 16);
        });
    });

    describe('calculateArrowPosition', () => {
        it('returns 0 when no anchor', () => {
            expect(calculateArrowPosition(null, { top: 100, left: 100 }, 'right')).toBe(0);
        });

        it('returns 0 when no popover position', () => {
            expect(calculateArrowPosition(anchor, null, 'right')).toBe(0);
        });

        it('calculates horizontal position for top/bottom placement', () => {
            const popPos = { top: 50, left: 200 };
            const arrowPos = calculateArrowPosition(anchor, popPos, 'top');
            expect(arrowPos).toBe(anchor.left + anchor.width / 2 - popPos.left - 6);
        });

        it('calculates vertical position for left/right placement', () => {
            const popPos = { top: 100, left: 400 };
            const arrowPos = calculateArrowPosition(anchor, popPos, 'right');
            expect(arrowPos).toBe(anchor.top + anchor.height / 2 - popPos.top - 6);
        });
    });
});
