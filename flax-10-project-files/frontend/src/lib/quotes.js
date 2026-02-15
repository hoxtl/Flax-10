// Morning (4am – 11:59am)
const MORNING_QUOTES = [
  "A fresh start begins here.",
  "Your workspace is ready.",
  "Begin gently.",
  "Start with clarity.",
  "Today is yours to shape.",
  "One steady step forward.",
  "Move gently, but move.",
  "This morning belongs to you.",
  "Let the day unfold with intention.",
  "Small beginnings matter.",
];

// Afternoon (12pm – 5:59pm)
const DAY_QUOTES = [
  "Progress is happening.",
  "Even slow progress is progress.",
  "Stay steady.",
  "Quiet effort compounds.",
  "This hour matters.",
  "The afternoon is for focus.",
  "Build something meaningful.",
  "Keep it simple. Keep going.",
];

// Evening (6pm – 9:59pm)
const EVENING_QUOTES = [
  "Close the day well.",
  "Finish with intention.",
  "Reflect, then reset.",
  "Let the work settle.",
  "A calm finish goes far.",
  "Wrap up with clarity.",
];

// Night (10pm – 3:59am)
const NIGHT_QUOTES = [
  "The quiet hours build strength.",
  "Calm mind. Clear direction.",
  "Stillness sharpens focus.",
  "Build quietly.",
  "Refine. Improve. Repeat.",
  "What you build now lasts.",
  "The unseen hours matter.",
  "Slow down. Stay sharp.",
];

function hashKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickQuoteByKey(key, hour = new Date().getHours()) {
  let pool;

  if (hour >= 5 && hour < 12) pool = MORNING_QUOTES;
  else if (hour >= 12 && hour < 18) pool = DAY_QUOTES;
  else if (hour >= 18 && hour < 22) pool = EVENING_QUOTES;
  else pool = NIGHT_QUOTES;

  const hash = hashKey(key);
  return pool[hash % pool.length];
}