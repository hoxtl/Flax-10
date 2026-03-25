/*
 * Dashboard user parsing helpers.
 */

export function formatUserYear(year) {
  if (!year) return "Year: ";
  const trimmed = String(year).trim();
  if (/^year\s+/i.test(trimmed)) return trimmed;
  if (!Number.isNaN(Number(trimmed))) return `Year ${trimmed}`;
  return trimmed;
}

export function parseStoredUser(user) {
  const hasName = user.first_name && user.last_name;
  const name = hasName ? `${user.first_name} ${user.last_name}` : user.username;
  return {
    name,
    year: formatUserYear(user.year),
    major: user.major || "Major: ",
    email: user.email,
    username: user.username,
    isAdmin: !!user.is_superuser,
    role: user.role,
  };
}

export function getStoredUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return undefined;
  try {
    return parseStoredUser(JSON.parse(rawUser));
  } catch (e) {
    console.error("Failed to parse stored user:", e);
  }
}
