import { describe, it, expect } from 'vitest';
import { getNearestMilestone } from '../../../components/Timer/utils/milestoneUtils';

describe('getNearestMilestone', () => {
    it('returns nearest session milestone when sessions is closest', () => {
        // 8 sessions → 2 away from 10; streak 0 → 3 away; hours 0 → 5 away
        const result = getNearestMilestone(8, 0, 0);
        expect(result).not.toBeNull();
        expect(result.type).toBe('sessions');
        expect(result.target).toBe(10);
        expect(result.remaining).toBe(2);
    });

    it('returns streak milestone when streak is closest', () => {
        // 8 sessions → 2 away from 10; streak 2 → 1 away from 3; hours 0 → 5 away
        const result = getNearestMilestone(8, 2, 0);
        expect(result).not.toBeNull();
        expect(result.type).toBe('streak');
        expect(result.target).toBe(3);
        expect(result.remaining).toBe(1);
    });

    it('returns hours milestone when hours is closest', () => {
        // 8 sessions → 2 away from 10; streak 5 → 2 away from 7; hours 4.5 → 0.5 away from 5
        const result = getNearestMilestone(8, 5, 4.5);
        expect(result).not.toBeNull();
        expect(result.type).toBe('hours');
        expect(result.target).toBe(5);
        expect(result.remaining).toBeCloseTo(0.5);
    });

    it('handles zero values for a brand-new user', () => {
        const result = getNearestMilestone(0, 0, 0);
        expect(result).not.toBeNull();
        // Nearest: sessions (10 away from 10), streak (3 away from 3), hours (5 away from 5)
        // streak wins with remaining=3
        expect(result.remaining).toBe(3);
        expect(result.type).toBe('streak');
    });

    it('returns null when all milestones are exceeded', () => {
        const result = getNearestMilestone(600, 150, 250);
        expect(result).toBeNull();
    });

    it('picks the single closest milestone across all three types', () => {
        // 24 sessions → 1 away from 25; streak 6 → 1 away from 7; hours 9 → 1 away from 10
        // All three tied at remaining=1 — any one is acceptable
        const result = getNearestMilestone(24, 6, 9);
        expect(result).not.toBeNull();
        expect(result.remaining).toBe(1);
    });
});
