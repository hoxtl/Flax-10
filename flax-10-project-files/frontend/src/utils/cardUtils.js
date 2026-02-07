export function getCardTheme(type) {
  return THEMES[type] || THEMES.other;
}

export function formatTimeRange(e) {
  if (!e.start || !e.end) return "—";
  return `${e.start} – ${e.end}`;
}

const THEMES = {
  travel: { accent: "#60A5FA", icon: "🚌" },
  class: { accent: "#A78BFA", icon: "📚" },
  study: { accent: "#34D399", icon: "🧠" },
  task: { accent: "#FBBF24", icon: "✅" },
  other: { accent: "#94A3B8", icon: "⭐" },
};
