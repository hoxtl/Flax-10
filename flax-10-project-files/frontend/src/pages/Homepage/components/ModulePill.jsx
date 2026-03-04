/**
 * Premium module and type pills — consistent design for Right Now, Deadlines, and popups.
 * Module pill: dot + code, palette or hash-based colour. Type pill: border + transparent bg.
 */

import { motion } from "framer-motion";
import styles from "./ModulePill.module.css";

export const MODULE_COLOURS = {
  FR4101: { bg: "#EDE9FE", text: "#6D28D9", accent: "#8B5CF6" },
  EE4303: { bg: "#E0F2FE", text: "#0369A1", accent: "#38BDF8" },
  EN4101: { bg: "#FEF3C7", text: "#A16207", accent: "#F59E0B" },
  EE4202: { bg: "#DCFCE7", text: "#15803D", accent: "#4ADE80" },
  CS3001: { bg: "#FFE4E6", text: "#BE123C", accent: "#FB7185" },
  default: { bg: "#F0EBE3", text: "#8B7355", accent: "#A89279" },
};

const HASH_PALETTE = [
  { bg: "#EDE9FE", text: "#6D28D9", accent: "#8B5CF6" },
  { bg: "#E0F2FE", text: "#0369A1", accent: "#38BDF8" },
  { bg: "#FEF3C7", text: "#A16207", accent: "#F59E0B" },
  { bg: "#DCFCE7", text: "#15803D", accent: "#4ADE80" },
  { bg: "#FFE4E6", text: "#BE123C", accent: "#FB7185" },
  { bg: "#FCE7F3", text: "#9D174D", accent: "#EC4899" },
  { bg: "#F0EBE3", text: "#8B7355", accent: "#A89279" },
];

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
      <span
        className={styles.pillDot}
        style={{ background: colors.accent }}
        aria-hidden
      />
      <span className={styles.pillCode}>{displayCode}</span>
    </>
  );

  const sharedProps = {
    ...pillMotion,
    className: `${styles.modulePill} ${className}`.trim(),
    style: {
      background: colors.bg,
      color: colors.text,
    },
  };

  if (asButton && onClick) {
    return (
      <motion.button
        type="button"
        {...sharedProps}
        onClick={onClick}
        aria-label={`View ${displayCode} details`}
      >
        {content}
      </motion.button>
    );
  }

  return <motion.span {...sharedProps}>{content}</motion.span>;
}

export function TypePill({ typeLabel, accentColor, className = "" }) {
  if (!typeLabel) return null;
  const label = (typeLabel || "").toString().trim();
  if (!label) return null;
  const accent = accentColor || MODULE_COLOURS.default.accent;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={`${styles.typePill} ${className}`.trim()}
      style={{
        border: `1px solid ${accent}4D`,
        background: `${accent}26`,
        color: accent,
      }}
    >
      {label}
    </motion.span>
  );
}
