/*
 * Plays the completion chime when a focus timer session ends.
 */
export function playCompletionChime(volume = 0.35) {
  try {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch (_) {}
}
