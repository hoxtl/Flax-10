/**
 * Messages for "all tasks complete" / day-clear state.
 */

const MESSAGES = [
  "You’re done for the day. Rest well.",
  "All clear. Time to recharge.",
  "Everything’s done. Enjoy the rest of your day.",
];

export function getClearMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}
