import { describe, it, expect } from 'vitest';
import {
    SOCIETY_CATEGORIES,
    SOCIETY_CATEGORY_OPTIONS,
    RATIFICATION_FILTERS,
    getCategoryLabel,
    matchesCategory,
    countByCategory,
} from '../../pages/Societies/societyFilters';

describe('SOCIETY_CATEGORIES', () => {
    it('is an array with at least 8 entries', () => {
        expect(Array.isArray(SOCIETY_CATEGORIES)).toBe(true);
        expect(SOCIETY_CATEGORIES.length).toBeGreaterThanOrEqual(8);
    });

    it('each entry has id and label', () => {
        SOCIETY_CATEGORIES.forEach(c => {
            expect(c).toHaveProperty('id');
            expect(c).toHaveProperty('label');
        });
    });
});

describe('SOCIETY_CATEGORY_OPTIONS', () => {
    it('has id and label for each entry', () => {
        SOCIETY_CATEGORY_OPTIONS.forEach(c => {
            expect(c).toHaveProperty('id');
            expect(c).toHaveProperty('label');
        });
    });
});

describe('RATIFICATION_FILTERS', () => {
    it('includes all, ratified, and unratified', () => {
        const ids = RATIFICATION_FILTERS.map(f => f.id);
        expect(ids).toContain('all');
        expect(ids).toContain('ratified');
        expect(ids).toContain('unratified');
    });
});

describe('getCategoryLabel', () => {
    it('returns label for known category id', () => {
        expect(getCategoryLabel('sports')).toBe('Sports');
        expect(getCategoryLabel('cultural')).toBe('Cultural');
    });

    it('returns the id itself for unknown category', () => {
        expect(getCategoryLabel('unknown_xyz')).toBe('unknown_xyz');
    });
});

describe('matchesCategory', () => {
    it('returns true for filterId === "all"', () => {
        expect(matchesCategory({ category: 'sports' }, 'all')).toBe(true);
    });

    it('returns true when society has matching single category', () => {
        const society = { category: 'sports' };
        expect(matchesCategory(society, 'sports')).toBe(true);
    });

    it('returns false when society category does not match', () => {
        const society = { category: 'religious' };
        expect(matchesCategory(society, 'sports')).toBe(false);
    });

    it('uses categories array when present', () => {
        const society = { categories: ['academic', 'professional'] };
        expect(matchesCategory(society, 'academic')).toBe(true);
    });

    it('uses includes list for academic filter (academic and professional)', () => {
        const society = { category: 'professional' };
        expect(matchesCategory(society, 'academic')).toBe(true);
    });

    it('uses includes list for arts filter (arts, music, dance)', () => {
        const society = { category: 'music' };
        expect(matchesCategory(society, 'arts')).toBe(true);
    });

    it('returns false for society with no category', () => {
        const society = {};
        expect(matchesCategory(society, 'sports')).toBe(false);
    });
});

describe('countByCategory', () => {
    const societies = [
        { category: 'sports' },
        { category: 'sports' },
        { category: 'cultural' },
        { categories: ['academic'] },
    ];

    it('counts matching societies', () => {
        expect(countByCategory(societies, 'sports')).toBe(2);
        expect(countByCategory(societies, 'cultural')).toBe(1);
        expect(countByCategory(societies, 'academic')).toBe(1);
    });

    it('counts all for "all" filterId', () => {
        expect(countByCategory(societies, 'all')).toBe(4);
    });

    it('returns 0 for no matches', () => {
        expect(countByCategory(societies, 'religious')).toBe(0);
    });
});
