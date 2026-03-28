import { describe, it, expect } from 'vitest';
import {
    getTflLinesForLocation,
    getRelevantDelays,
    getTflLineColor,
    getTflLinePillStyle,
    isSevereDisruption,
    TFL_LINE_COLOURS,
    TFL_LINE_PILL_COLOURS,
} from '../../../pages/homepage/utils/kclTflMapping';

describe('getTflLinesForLocation', () => {
    it('returns empty array for null or empty location', () => {
        expect(getTflLinesForLocation(null)).toEqual([]);
        expect(getTflLinesForLocation('')).toEqual([]);
    });

    it('returns lines for strand campus', () => {
        const lines = getTflLinesForLocation('Strand Campus');
        expect(lines).toContain('Northern');
        expect(lines).toContain('District');
    });

    it('returns lines for waterloo campus', () => {
        const lines = getTflLinesForLocation('Waterloo Campus');
        expect(lines).toContain('Jubilee');
        expect(lines).toContain('Northern');
    });

    it('returns empty for unknown location', () => {
        expect(getTflLinesForLocation('Unknown Place XYZ')).toEqual([]);
    });
});

describe('getRelevantDelays', () => {
    it('returns empty when delays is empty', () => {
        expect(getRelevantDelays({ location: 'Strand' }, [])).toEqual([]);
    });

    it('returns empty when nextEvent is null', () => {
        expect(getRelevantDelays(null, [{ lineName: 'Northern' }])).toEqual([]);
    });

    it('filters delays relevant to event location', () => {
        const delays = [
            { lineName: 'Northern', severity: 3 },
            { lineName: 'Jubilee', severity: 2 },
        ];
        const result = getRelevantDelays({ location: 'Strand' }, delays);
        expect(result.some(d => d.lineName === 'Northern')).toBe(true);
    });

    it('returns empty when no relevant lines match location', () => {
        const delays = [{ lineName: 'Elizabeth', severity: 5 }];
        expect(getRelevantDelays({ location: 'Strand' }, delays)).toEqual([]);
    });
});

describe('getTflLineColor', () => {
    it('returns color for known line', () => {
        expect(getTflLineColor('Northern')).toBe('#000000');
        expect(getTflLineColor('Victoria')).toBe('#0098D4');
    });

    it('handles Waterloo & City normalization', () => {
        expect(getTflLineColor('Waterloo & City')).toBe(TFL_LINE_COLOURS['waterloo-city']);
    });

    it('returns fallback color for unknown line', () => {
        expect(getTflLineColor('Unknown')).toBe('#78716c');
    });

    it('handles London Overground alias', () => {
        const color = getTflLineColor('London Overground');
        expect(color).toBe(TFL_LINE_COLOURS['overground']);
    });
});

describe('getTflLinePillStyle', () => {
    it('returns pill style for known line', () => {
        const style = getTflLinePillStyle('Northern');
        expect(style.bg).toBe('#000000');
        expect(style.text).toBe('#FFFFFF');
    });

    it('returns default style for unknown line', () => {
        const style = getTflLinePillStyle('Unknown');
        expect(style.bg).toBe('#78716c');
        expect(style.text).toBe('#FFFFFF');
    });
});

describe('isSevereDisruption', () => {
    it('returns false for null', () => {
        expect(isSevereDisruption(null)).toBe(false);
        expect(isSevereDisruption('')).toBe(false);
    });

    it('returns true for suspension', () => {
        expect(isSevereDisruption('Partial Suspension')).toBe(true);
    });

    it('returns true for severe delays', () => {
        expect(isSevereDisruption('Severe Delays')).toBe(true);
    });

    it('returns true for closure', () => {
        expect(isSevereDisruption('Part Closure')).toBe(true);
    });

    it('returns false for minor delays', () => {
        expect(isSevereDisruption('Minor Delays')).toBe(false);
    });
});
