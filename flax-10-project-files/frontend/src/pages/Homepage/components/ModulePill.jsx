/*
 * Module and type pills for Homepage overlays and widgets.
 */

import { motion } from "framer-motion";
import styles from "./ModulePill.module.css";

export const MODULE_COLOURS = {
  PS4202: { bg: "#F3F0FF", text: "#5B4A8A", accent: "#8B7BB8" },
  PS4101: { bg: "#EDF4FC", text: "#4A6D8C", accent: "#7BA3C4" },
  IR4101: { bg: "#FFF6E9", text: "#8C6D3F", accent: "#C4A46D" },
  EE4303: { bg: "#EFF7F0", text: "#4A7C5A", accent: "#7BB38E" },
  EE4202: { bg: "#FFF0F0", text: "#8C5A5A", accent: "#C48B8B" },
  FR4101: { bg: "#FFF4EE", text: "#8C5D3F", accent: "#C49070" },
  LS4101: { bg: "#F0F7F2", text: "#4A7360", accent: "#7BB396" },
  CS3001: { bg: "#F5F0F0", text: "#7A5A5A", accent: "#B38B8B" },
  EN4101: { bg: "#FFF6E9", text: "#8C6D3F", accent: "#C4A46D" },
  default: { bg: "#F5F0E8", text: "#736048", accent: "#A89279" },
};

const HASH_PALETTE = [
  { bg: "#F3F0FF", text: "#5B4A8A", accent: "#8B7BB8" },
  { bg: "#EDF4FC", text: "#4A6D8C", accent: "#7BA3C4" },
  { bg: "#FFF6E9", text: "#8C6D3F", accent: "#C4A46D" },
  { bg: "#EFF7F0", text: "#4A7C5A", accent: "#7BB38E" },
  { bg: "#FFF0F0", text: "#8C5A5A", accent: "#C48B8B" },
  { bg: "#FFF4EE", text: "#8C5D3F", accent: "#C49070" },
  { bg: "#F5F0F0", text: "#7A5A5A", accent: "#B38B8B" },
];

const TYPE_COLOURS = {
  COURSEWORK:   { bg: "#F5F0E8", text: "#736048", border: "rgba(115, 96, 72, 0.15)" },
  EXAM:         { bg: "#F5EDE8", text: "#7A5C48", border: "rgba(122, 92, 72, 0.15)" },
  PRESENTATION: { bg: "#F0EDE8", text: "#6B6048", border: "rgba(107, 96, 72, 0.15)" },
  LAB:          { bg: "#EDF0E8", text: "#5A6B48", border: "rgba(90, 107, 72, 0.15)" },
  REPORT:       { bg: "#F5F0E8", text: "#736048", border: "rgba(115, 96, 72, 0.15)" },
  QUIZ:         { bg: "#F5EDE8", text: "#7A5C48", border: "rgba(122, 92, 72, 0.15)" },
  default:      { bg: "#F5F0E8", text: "#736048", border: "rgba(115, 96, 72, 0.15)" },
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
  const code = normalizeLabel(moduleCode);
  if (!code) return null;
  const displayCode = code.length > 8 ? code.slice(0, 8) : code;
  const sharedProps = getModulePillProps(code, className);
  return asButton && onClick
    ? <ModulePillButton content={<ModulePillContent code={displayCode} colors={getModulePillColors(code)} />} displayCode={displayCode} onClick={onClick} sharedProps={sharedProps} />
    : <motion.span {...sharedProps}><ModulePillContent code={displayCode} colors={getModulePillColors(code)} /></motion.span>;
}

export function TypePill({ typeLabel, accentColor: _ignored, className = "" }) {
  const label = normalizeLabel(typeLabel);
  if (!label) return null;
  return <motion.span {...getTypePillProps(label, className)}>{label}</motion.span>;
}

function normalizeLabel(value) {
  return (value || "").toString().trim();
}

function getModulePillProps(code, className) {
  const colors = getModulePillColors(code);
  return {
    ...pillMotion,
    className: `${styles.modulePill} ${className}`.trim(),
    style: { background: colors.bg, color: colors.text },
  };
}

function ModulePillContent({ code, colors }) {
  return (
    <>
      <span className={styles.pillDot} style={{ background: colors.accent }} aria-hidden />
      <span className={styles.pillCode}>{code}</span>
    </>
  );
}

function ModulePillButton({ content, displayCode, onClick, sharedProps }) {
  return (
    <motion.button type="button" {...sharedProps} onClick={onClick} aria-label={`View ${displayCode} details`}>
      {content}
    </motion.button>
  );
}

function getTypePillProps(label, className) {
  const colours = TYPE_COLOURS[label.toUpperCase()] || TYPE_COLOURS.default;
  return {
    initial: { opacity: 0, scale: 0.85 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, delay: 0.15 },
    className: `${styles.typePill} ${className}`.trim(),
    style: {
      background: colours.bg,
      color: colours.text,
      border: `1px solid ${colours.border}`,
    },
  };
}
