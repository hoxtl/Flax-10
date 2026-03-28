import { describe, it, expect, vi } from 'vitest';
import { parseDropPayload, setupDragStart, handleDragOverEffect } from '../../../components/calendar/utils/dragUtils';

describe('dragUtils', () => {
    describe('parseDropPayload', () => {
        it('returns parsed data when type is accepted', () => {
            const e = {
                dataTransfer: {
                    getData: vi.fn().mockReturnValue(JSON.stringify({ type: 'event', data: { id: 1 } })),
                },
            };
            const result = parseDropPayload(e, ['event']);
            expect(result).toEqual({ type: 'event', data: { id: 1 } });
        });

        it('returns null when type is not accepted', () => {
            const e = {
                dataTransfer: {
                    getData: vi.fn().mockReturnValue(JSON.stringify({ type: 'task', data: {} })),
                },
            };
            const result = parseDropPayload(e, ['event']);
            expect(result).toBeNull();
        });

        it('returns null when JSON parsing fails', () => {
            const e = {
                dataTransfer: {
                    getData: vi.fn().mockReturnValue('invalid json'),
                },
            };
            const result = parseDropPayload(e, ['event']);
            expect(result).toBeNull();
        });
    });

    describe('setupDragStart', () => {
        it('sets data transfer with serialized data', () => {
            const setData = vi.fn();
            const e = { dataTransfer: { setData, effectAllowed: '' } };
            setupDragStart(e, 'event', { id: 1 });
            expect(setData).toHaveBeenCalledWith('application/json', JSON.stringify({ type: 'event', data: { id: 1 } }));
            expect(e.dataTransfer.effectAllowed).toBe('move');
        });
    });

    describe('handleDragOverEffect', () => {
        it('prevents default and sets dropEffect', () => {
            const e = {
                preventDefault: vi.fn(),
                dataTransfer: { dropEffect: '' },
            };
            handleDragOverEffect(e);
            expect(e.preventDefault).toHaveBeenCalled();
            expect(e.dataTransfer.dropEffect).toBe('move');
        });
    });
});
