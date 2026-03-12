import { describe, it, expect } from 'vitest';
import * as utils from '../../../../../components/Society/hooks/utils/societyHookUtils';

describe('societyHookUtils', () => {
    it('normalizeIsoTime', () => {
        expect(utils.normalizeIsoTime('2025-01-01T10:00')).toBe('2025-01-01T10:00:00');
        expect(utils.normalizeIsoTime('2025-01-01T10:00:00')).toBe('2025-01-01T10:00:00');
        expect(utils.normalizeIsoTime('')).toBe('');
    });

    it('getRecurrence paths', () => {
        expect(utils.getRecurrence({ frequency: 'daily' })).toBe('daily');
        expect(utils.getRecurrence('weekly')).toBe('weekly');
        expect(utils.getRecurrence(null)).toBe('none');
        expect(utils.getRecurrence({})).toBe('none');
    });

    it('getRecurrenceEndDate paths', () => {
        expect(utils.getRecurrenceEndDate({ end_date: '2025' })).toBe('2025');
        expect(utils.getRecurrenceEndDate('weekly')).toBeNull();
        expect(utils.getRecurrenceEndDate(null)).toBeNull();
    });

    it('parseTagId paths', () => {
        expect(utils.parseTagId('10')).toBe(10);
        expect(utils.parseTagId('abc')).toBeNull();
        expect(utils.parseTagId('')).toBeNull();
    });

    it('transformLegacyEventData', () => {
        const data = { title: 'T', date: '2025-01-01', startTime: '10:00' };
        const res = utils.transformLegacyEventData(data);
        expect(res.start_time).toBe('2025-01-01T10:00:00');
        expect(res.description).toBe('');
    });

    it('transformEventData', () => {
        const data = { start_time: '2025-01-01T10:00', recurrence: { frequency: 'daily' } };
        const res = utils.transformEventData(data);
        expect(res.start_time).toBe('2025-01-01T10:00:00');
        expect(res.recurrence).toBe('daily');
        
        const legacy = { title: 'T', date: '2025-01-01' };
        expect(utils.transformEventData(legacy).title).toBe('T');
    });
});
