import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import styles from "./AnimatedDropdown.module.css";

function CheckMark() {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500 }}
      className={styles.checkIcon}
    >
      <Check size={13} strokeWidth={2.5} aria-hidden />
    </motion.span>
  );
}

/** Normalise flat array entries to { value, label } */
function normalise(opt) {
  if (typeof opt === "string") return { value: opt, label: opt };
  return opt;
}

function OptionItem({ opt, isActive, onSelect, index }) {
  const { value, label } = normalise(opt);
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.14, delay: index * 0.025 }}
      onClick={() => onSelect(value)}
      className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
    >
      <span>{label}</span>
      {isActive && <CheckMark />}
    </motion.button>
  );
}

function FlatOptions({ options, value, onSelect }) {
  return options.map((opt, i) => {
    const { value: v } = normalise(opt);
    return (
      <OptionItem
        key={v}
        opt={opt}
        isActive={value === v}
        onSelect={onSelect}
        index={i}
      />
    );
  });
}

function GroupedOptions({ options, value, onSelect }) {
  return options.map((group) => (
    <div key={group.label}>
      <div className={styles.groupLabel}>{group.label}</div>
      {group.options.map((opt, i) => (
        <OptionItem
          key={opt.value}
          opt={opt}
          isActive={value === opt.value}
          onSelect={onSelect}
          index={i}
        />
      ))}
    </div>
  ));
}

function getAllOptions(options, grouped) {
  if (grouped) return options.flatMap((g) => g.options.map(normalise));
  return options.map(normalise);
}

export default function AnimatedDropdown({
  value,
  onChange,
  placeholder = "Select…",
  options = [],
  grouped = false,
  menuMaxHeight = 260,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDirection, setOpenDirection] = useState("down");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  const allOptions = getAllOptions(options, grouped);
  const estimatedMenuHeight = useMemo(() => {
    const base = grouped ? 72 : 24;
    const perOption = 38;
    const raw = base + allOptions.length * perOption;
    const numericCap = typeof menuMaxHeight === "number" ? menuMaxHeight : 260;
    return Math.min(numericCap, Math.max(140, raw));
  }, [allOptions.length, grouped, menuMaxHeight]);

  useEffect(() => {
    if (!isOpen) return;

    const recomputeDirection = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      setOpenDirection(shouldOpenUp ? "up" : "down");
    };

    recomputeDirection();
    window.addEventListener("resize", recomputeDirection);
    window.addEventListener("scroll", recomputeDirection, true);
    return () => {
      window.removeEventListener("resize", recomputeDirection);
      window.removeEventListener("scroll", recomputeDirection, true);
    };
  }, [isOpen, estimatedMenuHeight]);
  const selectedLabel =
    allOptions.find((o) => o.value === value)?.label || placeholder;

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className={`${styles.root} ${isOpen ? styles.rootOpen : ""} ${className}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen((o) => !o)}
        className={styles.trigger}
      >
        <span style={{ color: value ? "inherit" : "var(--muted)" }}>
          {selectedLabel}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className={styles.chevron}
        >
          <ChevronDown size={15} strokeWidth={2} aria-hidden />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openDirection === "up" ? 6 : -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: openDirection === "up" ? 6 : -6, scaleY: 0.95 }}
            transition={{ duration: 0.16 }}
            style={{
              originY: openDirection === "up" ? 1 : 0,
              maxHeight: typeof menuMaxHeight === "number" ? `${menuMaxHeight}px` : menuMaxHeight,
            }}
            className={`${styles.menu} ${openDirection === "up" ? styles.menuUp : ""}`}
          >
            {grouped ? (
              <GroupedOptions options={options} value={value} onSelect={handleSelect} />
            ) : (
              <FlatOptions options={options} value={value} onSelect={handleSelect} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
