// Welcome (gateway tone)
const WELCOME_QUOTES = [
  "Welcome back, you’re right on time.",
  "Take a breath. You’re here now.",
  "Settle in, your space is ready.",
  "A calm start goes a long way.",
  "Everything can be one step at a time.",
  "Let’s begin gently.",
  "You don’t have to do it all — just start.",
  "Small steps still move you forward.",
  "Let today be steady, not rushed.",
  "We’ll keep it simple from here.",
];

// Morning (5am – 11:59am)
const MORNING_QUOTES = [
  "Good morning — start softly.",
  "Fresh page. Same you.",
  "Choose one thing to begin.",
  "Let the day unfold with intention.",
  "Clear mind. Gentle momentum.",
  "You’re allowed to take it slow.",
  "Start with what matters most.",
  "A steady start is enough.",
  "Today has room for you.",
  "Begin with ease.",
];

// Afternoon (12pm – 5:59pm)
const DAY_QUOTES = [
  "Stay steady — you’re doing fine.",
  "Keep going, gently.",
  "One step is still progress.",
  "You’re allowed to reset mid-day.",
  "Return to what matters.",
  "Small wins count.",
  "You’re building something real.",
  "Keep it light. Keep it moving.",
  "You’ve got time for one good thing.",
  "Continue with calm focus.",
];

// Evening (6pm – 9:59pm)
const EVENING_QUOTES = [
  "Close the day with care.",
  "You’ve done enough for today.",
  "Wrap up what you can — release the rest.",
  "Let the day settle.",
  "Soft finish. Clear mind.",
  "Reflect, then reset.",
  "Leave a little space for tomorrow.",
  "You can slow down now.",
  "End gently — you earned it.",
  "Take the pressure off.",
];

// Night (10pm – 4:59am)
const NIGHT_QUOTES = [
  "Quiet hours. Gentle thoughts.",
  "Rest is part of progress.",
  "Let tomorrow handle tomorrow.",
  "Breathe — you’re safe to pause.",
  "Slow down. Let your mind soften.",
  "Even small rest helps.",
  "You can stop for now.",
  "Unwind — you’ve carried enough.",
  "Stillness is valuable too.",
  "Good night — be kind to yourself.",
];

function hashKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickWelcomeQuoteByKey(key) {
  const hash = hashKey(key);
  return WELCOME_QUOTES[hash % WELCOME_QUOTES.length];
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
