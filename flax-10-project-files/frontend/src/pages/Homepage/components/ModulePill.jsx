/*
 * Module and type pills for Homepage overlays and widgets.
 */

import { motion } from "framer-motion";
import styles from "./ModulePill.module.css";
import modulePillColors from "./modulePillColors.json";

export const MODULE_COLOURS = modulePillColors.MODULE_COLOURS;

const HASH_PALETTE = modulePillColors.HASH_PALETTE;

const TYPE_COLOURS = modulePillColors.TYPE_COLOURS;

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
