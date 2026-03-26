/*
 * GroupWork member avatar helpers.
 */

import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback.js";

/** Shared colour palette for member avatars and progress segments. */

export const MEMBER_PALETTE = [
  "var(--avatar-1)",
  "var(--avatar-2)",
  "var(--avatar-3)",
  "var(--avatar-4)",
  "var(--avatar-5)",
  "var(--avatar-6)",
  "var(--avatar-7)",
  "var(--avatar-8)",
  "var(--avatar-9)",
  "var(--avatar-10)",
];

/** Returns up to two initials for a member. */

export function getInitials(member) {
  if (member.first_name && member.last_name) return `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
  const name = member.user_name || member.name || member.first_name || "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

/** Returns a display name, preferring first + last name over username or name field. */

export function getDisplayName(member) {
  if (member.first_name) return `${member.first_name} ${member.last_name || ""}`.trim();
  return member.user_name || member.name || "";
}

/** Returns a stable string key for a member regardless of which ID field is present. */

export function getMemberKey(member) {
  return String(member?.user ?? member?.id ?? member?.user_name ?? member?.username ?? member?.name ?? "");
}

/** Builds a map from member key to palette colour, preserving member order. */

export function buildMemberColorMap(members = []) {
  const colorMap = {};
  const seen = new Set();
  members.forEach((member) => {
    const key = getMemberKey(member);
    if (!key || seen.has(key)) return;
    seen.add(key);
    colorMap[key] = MEMBER_PALETTE[seen.size - 1] || MEMBER_PALETTE[(seen.size - 1) % MEMBER_PALETTE.length];
  });
  return colorMap;
}

/** Returns the palette colour assigned to a member within a given member list. */

export function getMemberColor(member, members = []) {
  const key = getMemberKey(member);
  if (!key) return MEMBER_PALETTE[0];
  const map = buildMemberColorMap(members);
  return map[key] || MEMBER_PALETTE[0];
}

/** Resolves a photo URL for a member, falling back to a generated avatar. */

export function getPhotoUrl(member) {
  const username = member?.user_name || member?.username;
  return getResolvedUserPhoto({
    id: member?.user ?? member?.id,
    username,
    first_name: member?.first_name,
    last_name: member?.last_name,
    name: member?.name || getDisplayName(member),
    role: member?.role || "student",
    profile_photo_url: member?.profile_photo_url,
    profile_photo: member?.profile_photo,
    avatar: member?.avatar,
  }, {
    seed: username || getMemberKey(member),
    allowGeneric: true,
  });
}

/** Returns the profile navigation target string for a member, or null if no ID. */

export function getProfileNavTarget(member) {
  const userId = member.user ?? member.id;
  return userId ? `profile_${userId}` : null;
}

/** Fires a navigate event to open the member's profile page. */

export function openMemberProfile(event, member) {
  const target = getProfileNavTarget(member);
  if (!target) return;
  event?.stopPropagation?.();
  window.dispatchEvent(new CustomEvent("navigate", { detail: target }));
}

/** Returns the currently authenticated viewer's stored user object. */

export function getStoredViewer() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}
