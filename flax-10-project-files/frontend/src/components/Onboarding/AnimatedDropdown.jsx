import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import styles from "./OnboardingModal.module.css";

function GroupedOptions({ options, value, onSelect }) {
  return options.map((group) => (
    <div key={group.label}>
      <div className={styles.dropdownGroup}>{group.label}</div>
      {group.options.map((opt, i) => (
        <motion.button type="button" key={opt.value}
          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: i * 0.02 }}
          onClick={() => onSelect(opt.value)}
          className={`${styles.dropdownItem} ${value === opt.value ? styles.dropdownItemActive : ''}`}
        >
          <span>{opt.label}</span>
          {value === opt.value && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
              <Check size={14} />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  ));
}

function FlatOptions({ options, value, onSelect }) {
  return options.map((opt, i) => (
    <motion.button type="button" key={opt}
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: i * 0.03 }}
      onClick={() => onSelect(opt)}
      className={`${styles.dropdownItem} ${value === opt ? styles.dropdownItemActive : ''}`}
    >
      <span>{opt}</span>
      {value === opt && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
          <Check size={14} />
        </motion.div>
      )}
    </motion.button>
  ));
}

export default function AnimatedDropdown({ value, onChange, placeholder, options, grouped }) {
  const [isOpen, setIsOpen] = useState(false);

  const allOptions = grouped
    ? options.flatMap(g => g.options.map(o => ({ ...o, group: g.label })))
    : options.map(o => ({ value: o, label: o }));

  const selectedLabel = allOptions.find(o => o.value === value)?.label || placeholder;

  const handleSelect = (val) => { onChange(val); setIsOpen(false); };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <motion.button type="button" whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(!isOpen)} className={styles.dropdownBtn}
      >
        <span style={{ color: value ? 'inherit' : 'var(--muted)' }}>{selectedLabel}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown size={16} />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className={styles.dropdownMenu}
          >
            {grouped
              ? <GroupedOptions options={options} value={value} onSelect={handleSelect} />
              : <FlatOptions options={options} value={value} onSelect={handleSelect} />
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}