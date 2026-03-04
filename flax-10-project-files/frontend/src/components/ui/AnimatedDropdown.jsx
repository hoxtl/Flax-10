import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import styles from "./AnimatedDropdown.module.css";

function CheckMark() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
      <Check size={14} className={styles.checkIcon} />
    </motion.div>
  );
}

function GroupedOptionItem({ opt, value, onSelect, index }) {
  const val = opt.value ?? opt;
  const label = opt.label ?? opt;
  return (
    <motion.button
      type="button"
      key={val}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      onClick={() => onSelect(val)}
      className={`${styles.item} ${value === val ? styles.itemActive : ""}`}
    >
      <span>{label}</span>
      {value === val && <CheckMark />}
    </motion.button>
  );
}

function GroupedOptions({ options, value, onSelect }) {
  return options.map((group) => (
    <div key={group.label}>
      <div className={styles.groupLabel}>{group.label}</div>
      {group.options.map((opt, i) => (
        <GroupedOptionItem
          key={opt.value ?? opt}
          opt={opt}
          value={value}
          onSelect={onSelect}
          index={i}
        />
      ))}
    </div>
  ));
}

function FlatOptions({ options, value, onSelect }) {
  return options.map((opt, i) => {
    const val = typeof opt === "object" && opt !== null && "value" in opt ? opt.value : opt;
    const label = typeof opt === "object" && opt !== null && "label" in opt ? opt.label : String(opt);
    return (
      <motion.button
        type="button"
        key={val}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, delay: i * 0.03 }}
        onClick={() => onSelect(val)}
        className={`${styles.item} ${value === val ? styles.itemActive : ""}`}
      >
        <span>{label}</span>
        {value === val && <CheckMark />}
      </motion.button>
    );
  });
}

function useDropdownOptions(options, grouped) {
  if (!options) return [];
  const allOptions = grouped
    ? options.flatMap((g) => g.options.map((o) => ({ ...o, group: g.label })))
    : options.map((o) => (typeof o === "object" && o !== null && "value" in o ? o : { value: o, label: String(o) }));
  return allOptions;
}

export default function AnimatedDropdown({
  value,
  onChange,
  placeholder = "Select…",
  options = [],
  grouped = false,
  className,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const allOptions = useDropdownOptions(options, grouped);
  const selectedLabel =
    allOptions.find((o) => o.value === value || o.value === String(value))?.label ?? placeholder;

  const handleSelect = (val) => {
    onChange?.(val);
    setIsOpen(false);
  };

  return (
    <div className={`${styles.root} ${isOpen ? styles.rootOpen : ""} ${className ?? ""}`}>
      <motion.button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.99 }}
      >
        <span style={{ color: value !== undefined && value !== "" && value !== null ? "inherit" : "var(--muted, #9a8778)" }}>
          {selectedLabel}
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
