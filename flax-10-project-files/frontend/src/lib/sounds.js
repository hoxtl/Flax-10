/**
 * Shared sound helpers (chime for timer completion, etc.)
 */
export function playCompletionChime(volume = 0.35) {
  try {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch (_) {}
}
