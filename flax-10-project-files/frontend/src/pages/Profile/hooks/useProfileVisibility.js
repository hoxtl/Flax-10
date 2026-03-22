/**
 * useProfileVisibility - Determines what profile content is visible based on viewer relationship.
 *
 * Visibility Rules:
 * - Self: All widgets (Tasks, Modules, Events, Shared With, Achievements, Societies, Analytics)
 * - Others: Only Achievements, Societies, Modules. Calendar only if is_shared is true.
 */

export function useProfileVisibility(profileData, currentUser) {
    const isSelf = checkIsSelf(profileData, currentUser);
    const isShared = profileData?.is_shared_with_me || false;

    return {
        isSelf,
        isShared,
        canViewTasks: isSelf,
        canViewEvents: isSelf,
        canViewSharedWith: isSelf,
        canViewAnalytics: isSelf,
        canViewCalendar: !isSelf && isShared,
        canViewModules: true,
        canViewAchievements: true,
        canViewSocieties: true,
        canEditProfile: isSelf,
    };
}

function checkIsSelf(profileData, currentUser) {
    if (!profileData) return true;
    return profileData.username === currentUser?.username;
}

