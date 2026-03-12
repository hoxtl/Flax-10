/**
 * Premium module and type pills — consistent design for Right Now, Deadlines, and popups.
 * Module pill: dot + code, palette or hash-based colour. Type pill: lookup-based, no dot.
 */

import { motion } from "framer-motion";
import styles from "./ModulePill.module.css";

export const MODULE_COLOURS = {
  PS4202: { bg: "color-mix(in srgb, #8B7BB8 12%, var(--color-sidebar))", text: "var(--text-secondary)", accent: "#8B7BB8" },
  PS4101: { bg: "color-mix(in srgb, #7BA3C4 12%, var(--color-sidebar))", text: "var(--text-secondary)", accent: "#7BA3C4" },
  IR4101: { bg: "color-mix(in srgb, var(--color-highlight) 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "var(--color-highlight)" },
  EE4303: { bg: "color-mix(in srgb, var(--status-sage) 12%, var(--color-sidebar))", text: "var(--status-sage)", accent: "var(--status-sage)" },
  EE4202: { bg: "color-mix(in srgb, var(--danger) 12%, var(--color-sidebar))", text: "var(--danger)", accent: "var(--danger)" },
  FR4101: { bg: "color-mix(in srgb, #C49070 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "#C49070" },
  LS4101: { bg: "color-mix(in srgb, #7BB396 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "#7BB396" },
  CS3001: { bg: "color-mix(in srgb, #B38B8B 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "#B38B8B" },
  EN4101: { bg: "color-mix(in srgb, var(--color-highlight) 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "var(--color-highlight)" },
  default: { bg: "var(--color-sidebar)", text: "var(--color-primary-strong)", accent: "var(--color-primary)" },
};

const HASH_PALETTE = [
  { bg: "color-mix(in srgb, #8B7BB8 12%, var(--color-sidebar))", text: "var(--text-secondary)", accent: "#8B7BB8" },
  { bg: "color-mix(in srgb, #7BA3C4 12%, var(--color-sidebar))", text: "var(--text-secondary)", accent: "#7BA3C4" },
  { bg: "color-mix(in srgb, var(--color-highlight) 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "var(--color-highlight)" },
  { bg: "color-mix(in srgb, var(--status-sage) 12%, var(--color-sidebar))", text: "var(--status-sage)", accent: "var(--status-sage)" },
  { bg: "color-mix(in srgb, var(--danger) 12%, var(--color-sidebar))", text: "var(--danger)", accent: "var(--danger)" },
  { bg: "color-mix(in srgb, #C49070 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "#C49070" },
  { bg: "color-mix(in srgb, #B38B8B 12%, var(--color-sidebar))", text: "var(--color-primary-strong)", accent: "#B38B8B" },
];

const TYPE_COLOURS = {
  COURSEWORK: { bg: "color-mix(in srgb, var(--warning) 8%, var(--color-sidebar))", text: "var(--warning)", border: "var(--warning-border)" },
  EXAM: { bg: "color-mix(in srgb, var(--danger) 8%, var(--color-sidebar))", text: "var(--danger)", border: "var(--danger-border)" },
  PRESENTATION: { bg: "var(--color-sidebar)", text: "var(--color-primary-strong)", border: "var(--border)" },
  LAB: { bg: "color-mix(in srgb, var(--status-sage) 8%, var(--color-sidebar))", text: "var(--status-sage)", border: "color-mix(in srgb, var(--status-sage) 20%, transparent)" },
  REPORT: { bg: "var(--color-sidebar)", text: "var(--color-primary-strong)", border: "var(--border)" },
  QUIZ: { bg: "color-mix(in srgb, var(--color-highlight) 8%, var(--color-sidebar))", text: "var(--color-highlight)", border: "color-mix(in srgb, var(--color-highlight) 20%, transparent)" },
  default: { bg: "var(--color-sidebar)", text: "var(--color-primary-strong)", border: "var(--border)" },
};

function hashCode(str) {
  if (!str || typeof str !== "string") return 0;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

export function getModulePillColors(moduleCode) {
  const key = (moduleCode || "").toString().trim().toUpperCase();
  if (key && MODULE_COLOURS[key]) return MODULE_COLOURS[key];
  const idx = hashCode(key) % HASH_PALETTE.length;
  return HASH_PALETTE[idx] || MODULE_COLOURS.default;
}

const pillMotion = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.3, delay: 0.1 },
};

export function ModulePill({ moduleCode, onClick, asButton = false, className = "" }) {
  if (!moduleCode) return null;
  const code = (moduleCode || "").toString().trim();
  if (!code) return null;
  const colors = getModulePillColors(code);
  const displayCode = code.length > 8 ? code.slice(0, 8) : code;

  const content = (
    <>
      <span className={styles.pillDot} style={{ background: colors.accent }} aria-hidden />
      <span className={styles.pillCode}>{displayCode}</span>
    </>
  );

  const sharedProps = {
    ...pillMotion,
    className: `${styles.modulePill} ${className}`.trim(),
    style: { background: colors.bg, color: colors.text },
  };

  if (asButton && onClick) {
    return (
      <motion.button type="button" {...sharedProps} onClick={onClick} aria-label={`View ${displayCode} details`}>
        {content}
      </motion.button>
    );
  }

  return <motion.span {...sharedProps}>{content}</motion.span>;
}

export function TypePill({ typeLabel, accentColor: _ignored, className = "" }) {
  if (!typeLabel) return null;
  const label = (typeLabel || "").toString().trim();
  if (!label) return null;
  const key = label.toUpperCase();
  const colours = TYPE_COLOURS[key] || TYPE_COLOURS.default;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={`${styles.typePill} ${className}`.trim()}
      style={{
        background: colours.bg,
        color: colours.text,
        border: `1px solid ${colours.border}`,
      }}
    >
      {label}
    </motion.span>
  );
}
