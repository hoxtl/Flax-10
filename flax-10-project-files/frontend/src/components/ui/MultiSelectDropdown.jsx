import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import styles from "../common/AnimatedDropdown/AnimatedDropdown.module.css";
import pillStyles from "./MultiSelectDropdown.module.css";

function normalise(opt) {
  if (typeof opt === "string") return { value: opt, label: opt };
  return opt;
}

export default function MultiSelectDropdown({
  value = [],
  onChange,
  placeholder = "All",
  options = [],
  className = "",
  countLabel = "selected",
  displayAsPills = false,
  optionsAsPills = false,
  customTrigger,
  isOpen: forceOpen,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isCtrl = forceOpen !== undefined;
  const isOpen = isCtrl ? forceOpen : internalOpen;

  const updateOpen = (v) => {
    const next = typeof v === "function" ? v(isOpen) : v;
    if (!isCtrl) setInternalOpen(next);
    if (onOpenChange) onOpenChange(next);
  };

  const rootRef = useRef(null);
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) updateOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const opts = options.map(normalise);
  const selectedSet = new Set(selected);

  const triggerLabel = (() => {
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) {
      const o = opts.find((x) => x.value === selected[0]);
      return o ? o.label : placeholder;
    }
    return `${selected.length} ${countLabel}`;
  })();

  const handleToggle = (optValue) => {
    if (optValue === "") {
      onChange([]);
      return;
    }
    const next = selectedSet.has(optValue)
      ? selected.filter((v) => v !== optValue)
      : [...selected, optValue];
    onChange(next);
  };

  const handleRemovePill = (e, optValue) => {
    e.stopPropagation();
    handleToggle(optValue);
  };

  const renderTrigger = () => {
    if (displayAsPills) {
      return (
        <div
          className={pillStyles.triggerWithPills}
          onClick={() => updateOpen((o) => !o)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              updateOpen((o) => !o);
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          {selected.length === 0 ? (
            <span className={pillStyles.triggerPillsPlaceholder}>{placeholder}</span>
          ) : (
            selected.map((val) => {
              const o = opts.find((x) => x.value === val);
              const label = o ? o.label : val;
              return (
                <span
                  key={val}
                  className={pillStyles.pill}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{label}</span>
                  <button
                    type="button"
                    className={pillStyles.pillRemove}
                    onClick={(e) => handleRemovePill(e, val)}
                    aria-label={`Remove ${label}`}
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              );
            })
          )}
          <span className={pillStyles.triggerPillsDropdownBtn}>
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.22 }}
              className={pillStyles.chevron}
            >
              <ChevronDown size={15} strokeWidth={2} aria-hidden />
            </motion.span>
          </span>
        </div>
      );
    }

    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => updateOpen((o) => !o)}
        className={styles.trigger}
      >
        <span style={{ color: selected.length ? "inherit" : "var(--muted)" }}>
          {triggerLabel}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className={styles.chevron}
        >
          <ChevronDown size={15} strokeWidth={2} aria-hidden />
        </motion.span>
      </motion.button>
    );
  };

  return (
    <div ref={rootRef} className={`${styles.root} ${isOpen ? styles.rootOpen : ""} ${className}`} style={{ position: 'relative' }}>
      {customTrigger ? customTrigger : renderTrigger()}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.16 }}
            style={{ originY: 0 }}
            className={`${styles.menu} ${optionsAsPills ? pillStyles.menuPillsGrid : ""}`}
          >
            {opts.map((opt) => {
              const isActive = opt.value === "" ? selected.length === 0 : selectedSet.has(opt.value);
              return (
                <motion.button
                  key={opt.value || "__all__"}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.14 }}
                  onClick={() => handleToggle(opt.value)}
                  className={`${styles.item} ${optionsAsPills ? pillStyles.itemPill : ""} ${isActive ? (optionsAsPills ? pillStyles.itemPillActive : styles.itemActive) : ""}`}
                >
                  <span>{opt.label}</span>
                  {isActive && (
                    <span className={styles.checkIcon}>
                      <Check size={13} strokeWidth={2.5} aria-hidden />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
