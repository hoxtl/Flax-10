/*
 * Discover page pure helpers.
 */

export const USERS_PER_PAGE = 15;

export function getDisplayName(user) {
    const serverName = (user?.name || "").trim();
    if (serverName) return serverName;
    const baseName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    if (!baseName) return "User";
    return user?.role === "teacher" && !baseName.startsWith("Dr.") ? `Dr. ${baseName}` : baseName;
}

export function getRoleLabel(role) {
    if (role === "teacher") return "Teacher";
    if (role === "student") return "Student";
    if (role === "pending_teacher") return "Teacher applicant";
    return "User";
}

export function getDiscoverSortOptions() {
    return [{ value: 'name', label: 'A → Z' }, { value: 'name-desc', label: 'Z → A' }];
}

export function getCurrentUser() {
    return JSON.parse(localStorage.getItem("user")) || {};
}

export function filterVisibleUsers(users) {
    const currentUser = getCurrentUser();
    return users.filter((user) => user.id !== currentUser.id && user.username !== currentUser.username);
}

export function sortDiscoverUsers(users, sortBy) {
    const sorted = [...users];
    if (sortBy === 'name') return sorted.sort(compareUserNames);
    if (sortBy === 'name-desc') return sorted.sort((left, right) => compareUserNames(right, left));
    return sorted;
}

function compareUserNames(left, right) {
    return getDisplayName(left).toLowerCase().localeCompare(getDisplayName(right).toLowerCase());
}
