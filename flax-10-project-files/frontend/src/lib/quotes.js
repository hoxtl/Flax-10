// Morning (4am – 11:59am)
const MORNING_QUOTES = [
  "Good morning. Begin well.",
  "Take your time. Do it right.",
  "Start with intention.",
  "You have enough time.",
  "Decide who you are today.",
  "One good decision at a time.",
  "Today is yours to shape.",
  "Begin, even if it’s small.",
  "Move gently, but move.",
  "This hour matters.",
  "Begin before the noise begins.",
  "The sun rose. So can you.",
  "You are capable of wonderful things.",
  "Breathe."
];

// Afternoon (12pm – 5:59pm)
const DAY_QUOTES = [
  "Make this hour count.",
  "You’re closer than you think.",
  "Don’t quit at 70%.",
  "Keep building.",
  "Keep going.",
  "Halfway is not the finish line.",
  "Progress is happening.",
  "Small wins still count.",
  "Keep the rhythm.",
  "Even slow progress is progress.",
  "The afternoon is for quiet progress.",
  "The afternoon holds quiet power.",
  "You are capable of wonderful things.",
  "Continue",
  "Breathe.",
];

// Evening (6pm – 9:59pm)
const EVENING_QUOTES = [
  "Finish strong.",
  "One task at a time.",
  "Make yourself proud.",
  "Stay consistent.",
  "Small steps daily.",
  "Wrap up with purpose.",
  "You’re almost there.",
  "Last push.",
  "Close the day with intent.",
  "You are capable of wonderful things.",
  "Last rep energy.",
  "Breathe."
];

// Night (10pm – 3:59am)
const NIGHT_QUOTES = [
  "Quiet effort, loud results.",
  "Calm mind, sharp focus.",
  "Build while others rest.",
  "Discipline doesn't sleep.",
  "Breathe. Then begin.",
  "One quiet step forward.",
  "Silence builds strength.",
  "Earn tomorrow.",
  "Refine. Improve. Repeat.",
  "The world is asleep. You are not.",
  "Midnight sharpens focus.",
  "The unseen hours matter.",
  "You are capable of wonderful things.",
  "Breathe."
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