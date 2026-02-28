/** Single responsibility: build chart data from attendance stats. */

export function buildOverallChartData(overall) {
  const attended = overall?.attended ?? 0;
  const missed = overall?.missed ?? 0;
  return [
    { id: 0, value: attended, label: "Attended", color: "#4caf50" },
    { id: 1, value: missed, label: "Missed", color: "#f44336" },
  ].filter((d) => d.value > 0);
}

/** Normalize tag name for display: Small group, Lecture, Practical/lab, Other. */
function normalizeTypeLabel(name) {
  if (!name || typeof name !== "string") return "Other";
  const lower = name.toLowerCase().trim();
  if (lower.includes("small group") || lower === "smg") return "Small group";
  if (lower.includes("lecture")) return "Lecture";
  if (lower.includes("practical") || lower.includes("lab")) return "Practical/lab";
  return "Other";
}

const TYPE_COLOR_MAP = {
  Lecture: "#ff9800",
  "Small group": "#009688",
  "Practical/lab": "#2196f3",
  Other: "#9c27b0",
};

export function buildByTypeChartData(by_type) {
  const merged = {};
  Object.entries(by_type ?? {}).forEach(([name, counts]) => {
    const label = normalizeTypeLabel(name);
    if (!merged[label]) merged[label] = { attended: 0, missed: 0 };
    merged[label].attended += counts.attended || 0;
    merged[label].missed += counts.missed || 0;
  });
  return Object.entries(merged)
    .map(([label, counts]) => ({
      id: label,
      value: (counts.attended || 0) + (counts.missed || 0),
      label,
      color: TYPE_COLOR_MAP[label] ?? "#795548",
    }))
    .filter((d) => d.value > 0);
}

export function withByTypeColors(byTypeEntries) {
  return byTypeEntries.map((d, i) => ({
    ...d,
    id: i,
    color: d.color ?? ["#2196f3", "#9c27b0", "#ff9800", "#009688"][i % 4],
  }));
}
