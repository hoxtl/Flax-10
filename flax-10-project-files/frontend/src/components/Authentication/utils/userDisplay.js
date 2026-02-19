export function getDisplayName(user) {
  if (!user) return "";

  const first = (user.first_name || "").trim();
  if (first) return first;

  const username = (user.username || "").trim();
  if (username) return username;

  return "";
}

// Use only the user's first_name if present, otherwise fallback
export function getPreferredFirstName(user) {
  const first = (user?.first_name || "").trim();
  if (first) return first;

  const username = (user?.username || "").trim();
  return username;
}
