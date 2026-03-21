/**
 * Tests for calendarHelpers - date range calculation utilities.
 */
<<<<<<< HEAD

import { describe, it, expect } from 'vitest';
import { getDateRangeForView } from '../../../../components/calendar/hooks/calendarHelpers';
=======
import { describe, it, expect } from 'vitest';
import { getDateRangeForView } from '../../../../components/Calendar/hooks/calendarHelpers';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

describe('calendarHelpers', () => {
    describe('getDateRangeForView', () => {
        it('returns day range for day view', () => {
            const date = new Date(2026, 2, 15, 10, 30);
            const result = getDateRangeForView(date, 'day');
            expect(result.start).toContain('2026-03-15');
            expect(result.end).toContain('2026-03-15');
        });

        it('returns week range for week view', () => {
            const date = new Date(2026, 2, 18);
            const result = getDateRangeForView(date, 'week');
            expect(result.start).toBeDefined();
            expect(result.end).toBeDefined();
            const startDate = new Date(result.start);
            const endDate = new Date(result.end);
            expect(endDate.getTime() - startDate.getTime()).toBeGreaterThan(5 * 24 * 60 * 60 * 1000);
        });

        it('returns month range for month view', () => {
            const date = new Date(2026, 2, 15);
            const result = getDateRangeForView(date, 'month');
            expect(result.start).toContain('2026-03-01');
            expect(result.end).toContain('2026-03-31');
        });

        it('defaults to month range for unknown view', () => {
            const date = new Date(2026, 2, 15);
            const result = getDateRangeForView(date, 'unknown');
            expect(result.start).toContain('2026-03-01');
        });
    });
});
