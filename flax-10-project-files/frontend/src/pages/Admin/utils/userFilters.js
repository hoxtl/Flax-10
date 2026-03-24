/*
 * User filter helpers for the admin page.
 */

export function getUserRoleValue(user) {
  if (user.is_staff || user.is_superuser || user.role === "admin") return "admin";
  return user.role;
}

const ROLE_MATCHERS = {
  student: (user) => getUserRoleValue(user) === "student",
  teacher: (user) => getUserRoleValue(user) === "teacher",
  admin: (user) => getUserRoleValue(user) === "admin",
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
  return { roles: [], status: [] };
}

export function hasActiveUserFilters(filters) {
  return Object.values(filters).some((entries) => entries.length > 0);
}

export function matchesRoleFilter(user, roles) {
  return includesAny(roles, (role) => ROLE_MATCHERS[role]?.(user));
}

export function matchesStatusFilter(user, statuses) {
  return includesAny(statuses, (status) => STATUS_MATCHERS[status]?.(user));
}

export function matchesAllUserFilters(user, filters) {
  return matchesRoleFilter(user, filters.roles) && matchesStatusFilter(user, filters.status);
}

export function matchesUserSearch(user, search) {
  const haystack = `${user.username} ${user.email} ${user.first_name} ${user.last_name}`;
  return haystack.toLowerCase().includes(search.toLowerCase());
}

export function filterUsers(users, search, filters) {
  return users.filter((user) => matchesUserSearch(user, search) && matchesAllUserFilters(user, filters));
}
