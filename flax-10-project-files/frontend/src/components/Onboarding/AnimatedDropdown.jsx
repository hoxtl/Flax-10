import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";
import styles from "./OnboardingModal.module.css";

function SearchInput({ query, setQuery }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className={styles.searchWrapper}>
      <Search size={14} className={styles.searchIcon} />
      <input
        ref={ref}
        className={styles.searchInput}
        placeholder="Search courses..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <motion.div
      className={styles.emptyState}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
        className={styles.emptyIcon}
      >
        <Search size={20} strokeWidth={1.5} />
      </motion.div>
      <span className={styles.emptyTitle}>No courses found</span>
      {query && (
        <span className={styles.emptyQuery}>Try a different spelling for &ldquo;{query}&rdquo;</span>
      )}
    </motion.div>
  );
}

function filterGrouped(options, query) {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options
    .map(group => ({ ...group, options: group.options.filter(o => o.label.toLowerCase().includes(q)) }))
    .filter(group => group.options.length > 0);
}

function CheckMark() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
      <Check size={14} />
    </motion.div>
  );
}

function GroupedOptionItem({ opt, value, onSelect, index }) {
  return (
    <motion.button type="button" key={opt.value}
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      onClick={() => onSelect(opt.value)}
      className={`${styles.dropdownItem} ${value === opt.value ? styles.dropdownItemActive : ''}`}>
      <span>{opt.label}</span>
      {value === opt.value && <CheckMark />}
    </motion.button>
  );
}

function GroupedOptions({ options, value, onSelect }) {
  return options.map((group) => (
    <div key={group.label}>
      <div className={styles.dropdownGroup}>{group.label}</div>
      {group.options.map((opt, i) => (
        <GroupedOptionItem key={opt.value} opt={opt} value={value} onSelect={onSelect} index={i} />
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
      {value === opt && <CheckMark />}
    </motion.button>
  ));
}

function DropdownButton({ selectedLabel, value, isOpen, onClick }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.99 }} onClick={onClick} className={styles.dropdownBtn}>
      <span style={{ color: value ? 'inherit' : 'var(--muted)' }}>{selectedLabel}</span>
      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
        <ChevronDown size={16} />
      </motion.div>
    </motion.button>
  );
}

function DropdownMenu({ isOpen, grouped, options, value, onSelect, searchable, query, setQuery }) {
  const filteredOptions = (searchable && grouped) ? filterGrouped(options, query) : options;
  const isEmpty = searchable && grouped && filteredOptions.length === 0;
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className={styles.dropdownMenu}>
          {searchable && <SearchInput query={query} setQuery={setQuery} />}
          {isEmpty
            ? <EmptyState query={query} />
            : grouped
              ? <GroupedOptions options={filteredOptions} value={value} onSelect={onSelect} />
              : <FlatOptions options={options} value={value} onSelect={onSelect} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function useDropdownOptions(options, grouped) {
  const allOptions = grouped
    ? options.flatMap(g => g.options.map(o => ({ ...o, group: g.label })))
    : options.map(o => ({ value: o, label: o }));
  return allOptions;
}

export default function AnimatedDropdown({ value, onChange, placeholder, options, grouped, searchable }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const allOptions = useDropdownOptions(options, grouped);
  const selectedLabel = allOptions.find(o => o.value === value)?.label || placeholder;
  const handleSelect = (val) => { onChange(val); setIsOpen(false); setQuery(""); };
  const handleToggle = () => { setIsOpen(o => !o); setQuery(""); };
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <DropdownButton selectedLabel={selectedLabel} value={value} isOpen={isOpen} onClick={handleToggle} />
      <DropdownMenu isOpen={isOpen} grouped={grouped} options={options} value={value} onSelect={handleSelect}
        searchable={searchable} query={query} setQuery={setQuery} />
    </div>
  );
}