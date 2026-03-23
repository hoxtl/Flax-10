/*
 * User filter helpers for the admin page.
 */

const ROLE_MATCHERS = {
  student: (user) => user.role === "student",
  teacher: (user) => user.role === "teacher" || user.role === "pending_teacher",
};

const STATUS_MATCHERS = {
  active: (user) => !!user.is_active,
  banned: (user) => !user.is_active,
};

function includesAny(values, matcher) {
  return !values.length || values.some(matcher);
}

export function toggleArrayValue(values, value) {
  return values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];
}

export function createEmptyUserFilters() {
  return { roles: [], staff: [], status: [] };
}

export function hasActiveUserFilters(filters) {
  return Object.values(filters).some((entries) => entries.length > 0);
}

export function matchesRoleFilter(user, roles) {
  return includesAny(roles, (role) => ROLE_MATCHERS[role]?.(user));
}

export function matchesStaffFilter(user, staff) {
  return includesAny(staff, (role) => role === "staff" && (!!user.is_staff || !!user.is_superuser));
}

export function matchesStatusFilter(user, statuses) {
  return includesAny(statuses, (status) => STATUS_MATCHERS[status]?.(user));
}

export function matchesAllUserFilters(user, filters) {
  return matchesRoleFilter(user, filters.roles) && matchesStaffFilter(user, filters.staff) && matchesStatusFilter(user, filters.status);
}

export function matchesUserSearch(user, search) {
  const haystack = `${user.username} ${user.email} ${user.first_name} ${user.last_name}`;
  return haystack.toLowerCase().includes(search.toLowerCase());
}

export function filterUsers(users, search, filters) {
  return users.filter((user) => matchesUserSearch(user, search) && matchesAllUserFilters(user, filters));
}
