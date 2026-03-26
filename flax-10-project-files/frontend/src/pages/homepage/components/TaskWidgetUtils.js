import { getModulePillColors } from "./ModulePill";

const MODULE_CODE_RE = /^[A-Z]{2,4}\d{3,4}$/;

const CATEGORY_COLOURS = {
  UNIVERSITY: { bg: "color-mix(in srgb, var(--color-primary) 8%, var(--color-sidebar))", text: "var(--color-primary)" },
  HEALTH: { bg: "color-mix(in srgb, var(--status-sage) 8%, var(--color-sidebar))", text: "var(--status-sage)" },
  PERSONAL: { bg: "var(--color-sidebar)", text: "var(--color-primary-strong)" },
  WORK: { bg: "color-mix(in srgb, var(--warning) 8%, var(--color-sidebar))", text: "var(--warning)" },
  FINANCE: { bg: "color-mix(in srgb, var(--color-primary-strong) 8%, var(--color-sidebar))", text: "var(--color-primary-strong)" },
  STUDY: { bg: "color-mix(in srgb, var(--color-highlight) 12%, var(--color-sidebar))", text: "var(--color-primary-strong)" },
  default: { bg: "var(--color-sidebar)", text: "var(--color-primary-strong)" },
};

export function getCategoryStyle(label) {
  if (!label) return CATEGORY_COLOURS.default;
  const key = label.toUpperCase().trim();
  if (MODULE_CODE_RE.test(key)) {
    const c = getModulePillColors(key);
    return { bg: c.bg, text: c.text };
  }
  return CATEGORY_COLOURS[key] || CATEGORY_COLOURS.default;
}

export function getEstTime(items) {
  const incomplete = items.filter((t) => !t.completed);
  if (incomplete.length === 0) return null;
  const totalMin = incomplete.reduce((sum, t) => sum + (t.estimated_minutes || 25), 0);
  if (totalMin < 60) return `~${totalMin}m left`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `~${h}h ${m}m left` : `~${h}h left`;
}

export function getUrgencyMeta(task) {
  const status = task?.taskWidgetStatus;
  const p = String(task?.priority || "").toLowerCase();
  if (status === "overdue" || p === "urgent") return { label: "Urgent", tone: "urgent" };
  if (p === "high") return { label: "High", tone: "high" };
  if (status === "now") return { label: "Now", tone: "now" };
  return null;
}
