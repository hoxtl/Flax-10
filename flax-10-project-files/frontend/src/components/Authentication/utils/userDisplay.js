export function getDisplayName(user) {
  if (!user) return "";
  const first = (user.first_name || "").trim();
  if (first) return first;
  return (user.username || "").trim();
}

export const getPreferredFirstName = getDisplayName;
