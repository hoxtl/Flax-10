export function getDisplayName(user) {
  if (!user) return "";

  const first = (user.first_name || "").trim();
  if (first) return first;

  const username = (user.username || "").trim();
  if (username) return username;

  return "";
}
