import { describe, it, expect } from 'vitest';
import { useProfileVisibility } from '../../../pages/profile/hooks/useProfileVisibility';

describe('useProfileVisibility', () => {
    it('returns isSelf and all canView* true when profile is self', () => {
        const profileData = { username: 'alice' };
        const currentUser = { username: 'alice' };
        const result = useProfileVisibility(profileData, currentUser);
        expect(result.isSelf).toBe(true);
        expect(result.canViewTasks).toBe(true);
        expect(result.canViewEvents).toBe(true);
        expect(result.canViewSharedWith).toBe(true);
        expect(result.canViewAnalytics).toBe(true);
        expect(result.canViewCalendar).toBe(false);
        expect(result.canViewModules).toBe(true);
        expect(result.canViewAchievements).toBe(true);
        expect(result.canViewSocieties).toBe(true);
        expect(result.canEditProfile).toBe(true);
    });

    it('returns isSelf false and limited visibility for other user', () => {
        const profileData = { username: 'bob' };
        const currentUser = { username: 'alice' };
        const result = useProfileVisibility(profileData, currentUser);
        expect(result.isSelf).toBe(false);
        expect(result.canViewTasks).toBe(false);
        expect(result.canViewCalendar).toBe(false);
        expect(result.canEditProfile).toBe(false);
    });

    it('returns canViewCalendar true when not self but is_shared_with_me', () => {
        const profileData = { username: 'bob', is_shared_with_me: true };
        const currentUser = { username: 'alice' };
        const result = useProfileVisibility(profileData, currentUser);
        expect(result.isSelf).toBe(false);
        expect(result.isShared).toBe(true);
        expect(result.canViewCalendar).toBe(true);
    });

    it('treats missing profileData as self (checkIsSelf returns true)', () => {
        const result = useProfileVisibility(null, { username: 'alice' });
        expect(result.isSelf).toBe(true);
    });
});

