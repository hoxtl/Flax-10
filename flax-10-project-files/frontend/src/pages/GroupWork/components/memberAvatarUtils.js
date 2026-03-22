/*
 * GroupWork member avatar helpers.
 */

import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback.js";

const MEMBER_PALETTE = [
  "#7BB38E",
  "#9A8CB0",
  "#8A7060",
  "#7B9BAD",
  "#C4A46D",
  "#C0714E",
  "#6FA7A2",
  "#B0899A",
  "#859C67",
  "#B3915E",
];

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

export function getMemberKey(member) {
  return String(member?.user ?? member?.id ?? member?.user_name ?? member?.username ?? member?.name ?? "");
}

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

export function getMemberColor(member, members = []) {
  const key = getMemberKey(member);
  if (!key) return MEMBER_PALETTE[0];
  const map = buildMemberColorMap(members);
  return map[key] || MEMBER_PALETTE[0];
}

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

export function getProfileNavTarget(member) {
  const userId = member.user ?? member.id;
  return userId ? `profile_${userId}` : null;
}

export function openMemberProfile(event, member) {
  const target = getProfileNavTarget(member);
  if (!target) return;
  event?.stopPropagation?.();
  window.dispatchEvent(new CustomEvent("navigate", { detail: target }));
}
