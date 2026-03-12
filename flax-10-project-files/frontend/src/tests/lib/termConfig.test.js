import { describe, it, expect, beforeEach } from 'vitest';
import { loadTermConfig, saveTermConfig } from '../../lib/termConfig';
import { DEFAULT_TERM_CONFIG } from '../../lib/termDefaults';

describe('termConfig', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('DEFAULT_TERM_CONFIG has expected shape', () => {
        expect(DEFAULT_TERM_CONFIG).toHaveProperty('startDate');
        expect(DEFAULT_TERM_CONFIG).toHaveProperty('totalWeeks');
        expect(DEFAULT_TERM_CONFIG).toHaveProperty('hasReadingWeek');
        expect(DEFAULT_TERM_CONFIG).toHaveProperty('readingWeekAfterWeek');
    });

    it('loadTermConfig returns defaults when nothing is stored', () => {
        const config = loadTermConfig();
        expect(config).toEqual(DEFAULT_TERM_CONFIG);
    });

    it('loadTermConfig merges stored config with defaults', () => {
        localStorage.setItem('studyflax_term_config', JSON.stringify({ totalWeeks: 12 }));
        const config = loadTermConfig();
        expect(config.totalWeeks).toBe(12);
        expect(config.startDate).toBe(DEFAULT_TERM_CONFIG.startDate);
    });

    it('loadTermConfig returns defaults on invalid JSON', () => {
        localStorage.setItem('studyflax_term_config', 'not valid json');
        const config = loadTermConfig();
        expect(config).toEqual(DEFAULT_TERM_CONFIG);
    });

    it('saveTermConfig persists config to localStorage', () => {
        saveTermConfig({ totalWeeks: 15 });
        const raw = JSON.parse(localStorage.getItem('studyflax_term_config'));
        expect(raw.totalWeeks).toBe(15);
        expect(raw.startDate).toBe(DEFAULT_TERM_CONFIG.startDate);
    });
});
