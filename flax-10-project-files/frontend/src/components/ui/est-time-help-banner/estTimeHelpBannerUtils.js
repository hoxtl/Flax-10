/**
 * Est-time help banner helpers.
 */

export const STORAGE_KEY = "flax-est-time-banner-dismissed-v2";

export function buildChatDetail(initialMessage) {
  return typeof initialMessage === "string" && initialMessage.trim()
    ? { initialMessage: initialMessage.trim() }
    : {};
}

export function openFlaxChat(initialMessage) {
  try {
    window.dispatchEvent(new CustomEvent("flax-open-chat", { detail: buildChatDetail(initialMessage) }));
  } catch {
    return undefined;
  }
}

export function readDismissedState(persistDismiss) {
  if (!persistDismiss) return false;

  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function persistDismissedState(persistDismiss) {
  if (!persistDismiss) return;

  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    return undefined;
  }
}
