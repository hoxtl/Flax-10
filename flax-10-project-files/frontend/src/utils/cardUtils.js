export function getCardTheme(type) {
  return THEMES[type] || THEMES.other;
}

export function formatTimeRange(e) {
  if (!e.start_time || !e.end_time) return "—";
  const start = new Date(e.start_time);
  const end = new Date(e.end_time);
  const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${formatTime(start)} – ${formatTime(end)}`;
}

const THEMES = {
  travel: { accent: "#60A5FA", icon: "🚌" },
  class: { accent: "#A78BFA", icon: "📚" },
  study: { accent: "#34D399", icon: "🧠" },
  task: { accent: "#FBBF24", icon: "✅" },
  other: { accent: "#94A3B8", icon: "⭐" },
};
