/*
 * Shared helpers for society card/detail visuals and motion.
 */

export const SOCIETY_SHARED_TRANSITION = {
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1],
};

function normaliseImageUrl(image) {
  if (!image) return "";
  if (typeof image === "string") return image.trim();
  return `${image.url || ""}`.trim();
}

export function getSocietyImages(society) {
  const rawImages = Array.isArray(society?.images) ? society.images : [];
  const urls = rawImages.map(normaliseImageUrl).filter(Boolean);
  const primary = [society?.cover_image, society?.image].map(normaliseImageUrl).filter(Boolean);
  return Array.from(new Set([...primary, ...urls]));
}

export function getPrimarySocietyImage(society) {
  return getSocietyImages(society)[0] || "";
}

export function getSocietyHeroLayoutId(societyId) {
  return `society-hero-${societyId ?? "unknown"}`;
}

export function getSocietyTitleLayoutId(societyId) {
  return `society-title-${societyId ?? "unknown"}`;
}
