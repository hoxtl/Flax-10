import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import styles from "./AnimatedDropdown.module.css";

/**
 * Multi-select dropdown. value/onChange use arrays of selected values.
 * options: { value, label }[] or string[]
 */
export default function MultiSelectDropdown({
  value = [],
  onChange,
  options = [],
  placeholder = "Select…",
  countLabel = "selected",
  className,
  displayAsPills = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedOptions = options.map((o) =>
    typeof o === "object" && o !== null && "value" in o ? o : { value: o, label: String(o) }
  );
  const selectedSet = new Set(Array.isArray(value) ? value : [value]);
  const selectedLabels = normalizedOptions.filter((o) => selectedSet.has(o.value)).map((o) => o.label);
  const triggerLabel =
    selectedLabels.length === 0
      ? placeholder
      : countLabel
        ? `${selectedLabels.length} ${countLabel}`
        : selectedLabels.slice(0, 2).join(", ") + (selectedLabels.length > 2 ? "…" : "");

  const toggle = (val) => {
    const next = new Set(selectedSet);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange?.(Array.from(next));
  };

  return (
    <div className={`${styles.root} ${isOpen ? styles.rootOpen : ""} ${className ?? ""}`}>
      <motion.button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.99 }}
      >
        <span style={{ color: selectedSet.size > 0 ? "inherit" : "var(--muted, #9a8778)" }}>
          {triggerLabel}
        </span>
        <motion.div className={styles.chevron} animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={styles.menu}
          >
            {normalizedOptions.map((opt) => (
              <motion.button
                type="button"
                key={opt.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => toggle(opt.value)}
                className={`${styles.item} ${selectedSet.has(opt.value) ? styles.itemActive : ""}`}
              >
                <span>{opt.label}</span>
                {selectedSet.has(opt.value) && (
                  <span className={styles.checkIcon}>
                    <Check size={14} />
                  </span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
