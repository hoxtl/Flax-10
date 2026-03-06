/**
 * Auto-Emoji Engine for Plan timeline and task displays.
 * Maps task/event titles to cute, contextual emojis with a time-based fallback.
 */

/** Keyword → emoji mapping (order matters: first match wins). Case-insensitive. */
const EMOJI_MAP = [
  { keywords: ["study", "exam", "revision", "seg", "assignment", "library", "research"], emoji: "📖" },
  { keywords: ["lecture", "seminar", "tutorial", "class", "workshop"], emoji: "🎓" },
  { keywords: ["breakfast", "coffee", "tea", "wake up", "morning"], emoji: "☕" },
  { keywords: ["lunch", "dinner", "snack", "meal", "food", "cooking"], emoji: "🍱" },
  { keywords: ["gym", "run", "walk", "workout", "yoga", "sport", "swim"], emoji: "🏃‍♀️" },
  { keywords: ["meditation", "skin", "journal", "relax", "break", "breathe"], emoji: "✨" },
  { keywords: ["laundry", "clean", "groceries", "tidy", "admin", "emails"], emoji: "🧺" },
  { keywords: ["friend", "call", "meeting", "date", "party", "game", "movie"], emoji: "🎈" },
  { keywords: ["bed", "sleep", "wind down", "night", "nap"], emoji: "🌙" },
  { keywords: ["bus", "train", "drive", "travel", "commute"], emoji: "🚌" },
];

/**
 * Get time-of-day fallback emoji when no keyword matches.
 * 06:00–11:00 ☀️ Morning Sun | 11:00–17:00 🌱 Growth | 17:00–22:00 🌆 Sunset | 22:00–06:00 ☁️ Dream
 */
function getFallbackEmojiForTime(date) {
  const d = date instanceof Date ? date : date ? new Date(date) : new Date();
  const hour = d.getHours() + d.getMinutes() / 60;
  if (hour >= 6 && hour < 11) return "☀️";
  if (hour >= 11 && hour < 17) return "🌱";
  if (hour >= 17 && hour < 22) return "🌆";
  return "☁️"; // 22:00–06:00
}

/**
 * Get the best emoji for a task/event.
 * @param {string} title - Task or event title (matched case-insensitively).
 * @param {Date|string|null} [startTime] - Optional start time for fallback when no keyword matches.
 * @returns {string} Single emoji character(s).
 */
export function getTaskEmoji(title, startTime) {
  const t = (title || "").trim().toLowerCase();
  if (!t) return getFallbackEmojiForTime(startTime);

  for (const { keywords, emoji } of EMOJI_MAP) {
    for (const kw of keywords) {
      if (t.includes(kw)) return emoji;
    }
  }

  return getFallbackEmojiForTime(startTime);
}
