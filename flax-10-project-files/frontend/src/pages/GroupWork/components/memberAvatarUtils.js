/*
 * GroupWork member avatar helpers.
 */

export function getInitials(member) {
  if (member.first_name && member.last_name) return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
  const name = member.user_name || member.name || member.first_name || "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

export function getDisplayName(member) {
  if (member.first_name) return `${member.first_name} ${member.last_name || ""}`.trim();
  return member.user_name || member.name || "";
}

export function getPhotoUrl(member) {
  return member.profile_photo_url || member.profile_photo || member.avatar || null;
}
