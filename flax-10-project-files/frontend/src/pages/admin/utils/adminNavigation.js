/*
 * Admin navigation helpers.
 */

export function emitAdminNavigation(detail) {
  window.dispatchEvent(new CustomEvent("navigate", { detail }));
}

export function navigateToSociety(societyId) {
  emitAdminNavigation(`societies_${societyId}`);
}

export function navigateToProfile(onNavigate, userId) {
  return onNavigate?.(`profile_${userId}`);
}
