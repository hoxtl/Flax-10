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

    it('transformAnnouncementData returns ann and evData', () => {
        const data = { title: 'Ann', content: 'Body', tag: 5 };
        const res = utils.transformAnnouncementData(data, {}, {});
        expect(res.ann.title).toBe('Ann');
        expect(res.ann.content).toBe('Body');
        expect(res.evData.description).toBe('Body');
    });

    it('normalises announcement/event payloads when optional fields are falsy', () => {
        expect(utils.transformAnnouncementData({ title: 'Ann', content: '', tag: 0 }).ann.tag).toBeNull();
        expect(utils.transformAnnouncementData({ title: 'Ann', content: '', tag: 0 }).evData.tag).toBeNull();
        expect(
            utils.transformEventData({
                start_time: '2025-01-01T10:00',
                end_time: '2025-01-01T11:00',
                tag: '',
                recurrence: null,
                announcement: 0,
            }),
        ).toEqual(expect.objectContaining({ tag: null, recurrence: 'none', announcement: null }));
    });

    it('transformLegacyEventData with all fields', () => {
        const data = { title: 'T', date: '2025-01-01', startTime: '09:00', endTime: '10:00',
            description: 'Desc', location: 'Place', allDay: true, tag: '5', recurrence: 'weekly' };
        const res = utils.transformLegacyEventData(data);
        expect(res.end_time).toBe('2025-01-01T10:00:00');
        expect(res.all_day).toBe(true);
        expect(res.location).toBe('Place');
        expect(res.recurrence).toBe('weekly');
    });

    it('parseTagId with valid number', () => {
        expect(utils.parseTagId(5)).toBe(5);
    });
});
