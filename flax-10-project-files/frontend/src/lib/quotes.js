/*
 * Picks a stable welcome quote from the user key for the homepage greeting.
 */

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

function hashKey(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Stable per key
export function pickWelcomeQuoteByKey(key) {
  const hash = hashKey(key);
  return WELCOME_QUOTES[hash % WELCOME_QUOTES.length];
}
