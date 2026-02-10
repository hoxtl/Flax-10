export const LOCAL_QUOTES = [
    "Never stop exploring.",
    "Make it count.",
    "Stay curious.",
    "One task at a time.",
    "Small steps daily.",
    "Keep going.",
    "Start, then improve.",
    "Progress over perfection.",
    "Breathe. Then begin.",
    "Do the next thing.",
    "Every day is precious."
  ];
  
  export function pickQuoteByKey(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return LOCAL_QUOTES[hash % LOCAL_QUOTES.length];
  }
  