import { ChevronDown, ChevronUp } from "lucide-react";
import { motion as Motion } from "framer-motion";
import styles from "./ExpandablePillButton.module.css";

export default function ExpandablePillButton({
  className = "",
  collapsedLabel,
  expanded,
  expandedLabel = "Show less",
  onToggle,
  type = "button",
}) {
  return (
    <Motion.button
      type={type}
      className={[styles.button, className].filter(Boolean).join(" ")}
      onClick={onToggle}
      aria-expanded={expanded}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      layout="position"
    >
      <Motion.span
        aria-hidden
        key={expanded ? "up" : "down"}
        initial={{ opacity: 0, rotate: expanded ? -90 : 90 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: "inline-flex" }}
      >
        {expanded ? <ChevronUp size={14} strokeWidth={2.5} aria-hidden /> : <ChevronDown size={14} strokeWidth={2.5} aria-hidden />}
      </Motion.span>
      <Motion.span
        key={expanded ? "less" : "more"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        {expanded ? expandedLabel : collapsedLabel}
      </Motion.span>
    </Motion.button>
  );
}
