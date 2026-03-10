import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateNewHeight, commitResize, createResizeSession } from '../../components/Calendar/utils/resizeUtils';

// Mock calendarConstants
vi.mock('../../components/Calendar/calendarConstants', () => ({
    SLOT_HEIGHT: 60,
    SNAP_INTERVAL: 15,
    pixelsToMinutes: (px) => (px / 60) * 60, // 1px = 1min for simplicity
}));

describe('resizeUtils', () => {
    describe('calculateNewHeight', () => {
        it('calculates new height from delta', () => {
            const height = calculateNewHeight(60, 90, 60); // diff = 30
            // rawHeight = 90, minutes = round((90/60)*60/15)*15 = round(90/15)*15 = 90
            // height = (90/60)*60 = 90
            expect(typeof height).toBe('number');
            expect(height).toBeGreaterThan(0);
        });

        it('returns minimum height when delta is very negative', () => {
            const height = calculateNewHeight(60, 0, 500); // diff = -500, rawHeight < 0
            // Min is SLOT_HEIGHT * (SNAP_INTERVAL/60) = 60 * (15/60) = 15
            expect(height).toBe(15);
        });
    });

    describe('commitResize', () => {
        it('calls editEvent with updated event duration', () => {
            const event = { id: 1, duration: 60 };
            const editEvent = vi.fn();
            commitResize(event, 30, editEvent); // 30px diff
            expect(editEvent).toHaveBeenCalledWith(
                expect.objectContaining({ duration: expect.any(Number) })
            );
        });

        it('uses minimum snap interval for very small durations', () => {
            const event = { id: 1, duration: 60 };
            const editEvent = vi.fn();
            commitResize(event, -1000, editEvent); // huge negative
            const calledWith = editEvent.mock.calls[0][0];
            expect(calledWith.duration).toBeGreaterThanOrEqual(15); // SNAP_INTERVAL
        });
    });

    describe('createResizeSession', () => {
        let addSpy, removeSpy;

        beforeEach(() => {
            addSpy = vi.spyOn(document, 'addEventListener');
            removeSpy = vi.spyOn(document, 'removeEventListener');
        });

        afterEach(() => {
            addSpy.mockRestore();
            removeSpy.mockRestore();
        });

        it('adds mousemove and mouseup listeners', () => {
            const onMove = vi.fn();
            const onEnd = vi.fn();
            createResizeSession(100, 60, { onMove, onEnd });
            expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
        });

        it('calls onMove with clamped height on mousemove', () => {
            const onMove = vi.fn();
            const onEnd = vi.fn();
            createResizeSession(100, 60, { onMove, onEnd });

            const moveHandler = addSpy.mock.calls.find(c => c[0] === 'mousemove')[1];
            moveHandler({ clientY: 130 }); // diff = 30, height = 60+30 = 90
            expect(onMove).toHaveBeenCalledWith(90);
        });

        it('calls onEnd and removes listeners on mouseup', () => {
            const onMove = vi.fn();
            const onEnd = vi.fn();
            createResizeSession(100, 60, { onMove, onEnd });

            const upHandler = addSpy.mock.calls.find(c => c[0] === 'mouseup')[1];
            upHandler({ clientY: 130 }); // diff = 30
            expect(onEnd).toHaveBeenCalledWith(30);
            expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
        });
    });
});
