/**
 * AnimatedDropdown — shared animated dropdown component with optional grouped options
 * and an inline search bar. Used throughout the onboarding and module selection flows.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";
import styles from "./AnimatedDropdown.module.css";

/**
 * Text input with a leading search icon, auto-focused on mount.
 * @param {object} props
 * @param {string} props.query - Current search string.
 * @param {Function} props.setQuery - Setter for the search string.
 * @param {string} props.placeholder - Placeholder text for the input.
 */
function SearchInput({ query, setQuery, placeholder }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className={styles.searchWrapper}>
      <Search size={14} className={styles.searchIcon} />
      <input ref={ref} className={styles.searchInput} placeholder={placeholder}
        value={query} onChange={e => setQuery(e.target.value)} onClick={e => e.stopPropagation()} />
    </div>
  );
}

/**
 * Animated search icon that wiggles on mount inside the empty state.
 */
function EmptyIcon() {
  return (
    <motion.div
      animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
      transition={{ duration: 0.6, delay: 0.1, ease: "easeInOut" }}
      className={styles.emptyIcon}
    >
      <Search size={20} strokeWidth={1.5} />
    </motion.div>
  );
}

/**
 * Shown when a search query matches no options.
 * @param {object} props
 * @param {string} props.query - Current search string (used to conditionally show hint).
 * @param {string} props.emptyMessage - Primary message to display.
 */
function EmptyState({ query, emptyMessage }) {
  return (
    <motion.div className={styles.emptyState}
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
      <EmptyIcon />
      <span className={styles.emptyTitle}>{emptyMessage}</span>
      {query && <span className={styles.emptyQuery}>Try a different search term</span>}
    </motion.div>
  );
}

/**
 * Filters grouped options by matching each option label against a query string.
 * @param {Array} options - Grouped options array.
 * @param {string} query - Search query.
 * @returns {Array} Filtered grouped options.
 */
function filterGrouped(options, query) {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options
    .map(group => ({ ...group, options: group.options.filter(o => o.label.toLowerCase().includes(q)) }))
    .filter(group => group.options.length > 0);
}

/**
 * Filters a flat string options array against a query string.
 * @param {string[]} options - Flat options array.
 * @param {string} query - Search query.
 * @returns {string[]} Filtered options.
 */
function filterFlat(options, query) {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options.filter(o => {
    const label = typeof o === 'string' ? o : o.label;
    return label.toLowerCase().includes(q);
  });
}

/**
 * Animated checkmark shown next to the currently selected item.
 */
function CheckMark() {
  return (
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500 }}>
      <Check size={14} />
    </motion.div>
  );
}

/**
 * A single option row within a grouped dropdown.
 * @param {object} props
 * @param {{ value: string, label: string }} props.opt - The option to render.
 * @param {string} props.value - The currently selected value.
 * @param {Function} props.onSelect - Callback invoked with the selected value.
 * @param {number} props.index - Position index used to stagger the entrance animation.
 */
function GroupedOptionItem({ opt, value, onSelect, index }) {
  return (
    <motion.button type="button"
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      onClick={() => onSelect(opt.value)}
      className={`${styles.dropdownItem} ${value === opt.value ? styles.dropdownItemActive : ''}`}>
      <span>{opt.label}</span>
      {value === opt.value && <CheckMark />}
    </motion.button>
  );
}

/**
 * Renders all option rows for a grouped options set.
 * @param {object} props
 * @param {Array} props.options - Grouped options array.
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onSelect - Selection callback.
 */
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

/**
 * Renders all option rows for a flat (non-grouped) string options set.
 * @param {object} props
 * @param {string[]} props.options - Flat options array.
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onSelect - Selection callback.
 */
function FlatOptions({ options, value, onSelect }) {
  return options.map((opt, i) => {
    const optValue = typeof opt === 'string' ? opt : opt.value;
    const optLabel = typeof opt === 'string' ? opt : opt.label;
    return (
      <motion.button type="button" key={optValue ?? i}
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, delay: i * 0.03 }}
        onClick={() => onSelect(optValue)}
        className={`${styles.dropdownItem} ${value === optValue ? styles.dropdownItemActive : ''}`}
      >
        <span>{optLabel}</span>
        {value === optValue && <CheckMark />}
      </motion.button>
    );
  });
}

/**
 * The trigger button that shows the selected label and a chevron indicator.
 * @param {object} props
 * @param {string} props.selectedLabel - Label text to display.
 * @param {string} props.value - Currently selected value (used to dim placeholder text).
 * @param {boolean} props.isOpen - Whether the dropdown is open.
 * @param {Function} props.onClick - Toggle callback.
 */
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

/**
 * Inner content of the open dropdown: optional search bar followed by the option list
 * or an empty state when no options match the query.
 * @param {object} props
 * @param {boolean} props.grouped - Whether options are grouped.
 * @param {Array|string[]} props.filteredOptions - Already-filtered options to render.
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onSelect - Selection callback.
 * @param {boolean} props.searchable - Whether to show the search input.
 * @param {string} props.query - Current search query.
 * @param {Function} props.setQuery - Setter for the search query.
 * @param {string} props.searchPlaceholder - Placeholder for the search input.
 * @param {string} props.emptyMessage - Message shown when no options match.
 */
function DropdownContent({
  grouped, filteredOptions, value, onSelect,
  searchable, query, setQuery, searchPlaceholder, emptyMessage,
}) {
  const isEmpty = searchable && filteredOptions.length === 0;
  return (
    <>
      {searchable && <SearchInput query={query} setQuery={setQuery} placeholder={searchPlaceholder} />}
      {isEmpty && <EmptyState query={query} emptyMessage={emptyMessage} />}
      {!isEmpty && grouped && <GroupedOptions options={filteredOptions} value={value} onSelect={onSelect} />}
      {!isEmpty && !grouped && <FlatOptions options={filteredOptions} value={value} onSelect={onSelect} />}
    </>
  );
}

/**
 * Animated panel wrapper that slides the dropdown menu in and out.
 * @param {object} props
 * @param {boolean} props.grouped - Whether options are grouped.
 * @param {Array|string[]} props.filteredOptions - Already-filtered options.
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onSelect - Selection callback.
 * @param {boolean} props.searchable - Whether to show the search input.
 * @param {string} props.query - Current search query.
 * @param {Function} props.setQuery - Setter for the search query.
 * @param {string} props.searchPlaceholder - Placeholder for the search input.
 * @param {string} props.emptyMessage - Message shown when no options match.
 * @param {boolean} props.openUpward - Whether to open the menu upward.
 * @param {number} props.menuMaxHeight - Max height for the menu.
 */
function DropdownPanel({
  grouped, filteredOptions, value, onSelect,
  searchable, query, setQuery, searchPlaceholder, emptyMessage, openUpward, menuMaxHeight,
}) {
  const yOffset = openUpward ? 8 : -8;
  const menuStyle = openUpward ? { bottom: '100%', top: 'auto', marginBottom: 4 } : {};
  if (menuMaxHeight) menuStyle.maxHeight = menuMaxHeight;
  return (
    <motion.div initial={{ opacity: 0, y: yOffset }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: yOffset }} transition={{ duration: 0.18 }} className={styles.dropdownMenu} style={menuStyle}>
      <DropdownContent grouped={grouped} filteredOptions={filteredOptions} value={value} onSelect={onSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage} />
    </motion.div>
  );
}

/**
 * Conditionally renders DropdownPanel inside AnimatePresence when the menu is open.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the menu is visible.
 * @param {boolean} props.grouped - Whether options are grouped.
 * @param {Array|string[]} props.options - Raw options passed to filtering.
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onSelect - Selection callback.
 * @param {boolean} props.searchable - Whether to show the search input.
 * @param {string} props.query - Current search query.
 * @param {Function} props.setQuery - Setter for the search query.
 * @param {string} props.searchPlaceholder - Placeholder for the search input.
 * @param {string} props.emptyMessage - Message shown when no options match.
 * @param {boolean} props.openUpward - Whether to open the menu upward.
 * @param {number} props.menuMaxHeight - Max height for the menu.
 */
function DropdownMenu({ isOpen, grouped, options, value, onSelect, searchable, query, setQuery, searchPlaceholder, emptyMessage, openUpward, menuMaxHeight }) {
  const filteredOptions = searchable ? (grouped ? filterGrouped(options, query) : filterFlat(options, query)) : options;
  return (
    <AnimatePresence>
      {isOpen && <DropdownPanel grouped={grouped} filteredOptions={filteredOptions} value={value} onSelect={onSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage}
        openUpward={openUpward} menuMaxHeight={menuMaxHeight} />}
    </AnimatePresence>
  );
}

/**
 * Converts raw options into a normalised `{ value, label }` list used for label lookup.
 * @param {Array|string[]} options - Raw options (flat or grouped).
 * @param {boolean} grouped - Whether options are grouped.
 * @returns {{ value: string, label: string }[]} Flat normalised option list.
 */
function useDropdownOptions(options, grouped) {
  return grouped
    ? options.flatMap(g => g.options.map(o => ({ ...o, group: g.label })))
    : options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
}

/**
 * Manages open/closed state, query state, derived label, and event handlers
 * for an AnimatedDropdown instance.
 * @param {Array|string[]} options - Raw options.
 * @param {boolean} grouped - Whether options are grouped.
 * @param {string} placeholder - Placeholder text shown when nothing is selected.
 * @param {string} value - Currently selected value.
 * @param {Function} onChange - External change callback.
 * @returns {{ isOpen, query, setQuery, selectedLabel, handleSelect, handleToggle }}
 */
function useDropdownState(options, grouped, placeholder, value, onChange) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const allOptions = useDropdownOptions(options, grouped);
  const selectedLabel = allOptions.find(o => o.value === value)?.label || placeholder;
  const handleSelect = (val) => { onChange(val); setIsOpen(false); setQuery(""); };
  const handleToggle = () => { setIsOpen(o => !o); setQuery(""); };
  return { isOpen, query, setQuery, selectedLabel, handleSelect, handleToggle };
}

/**
 * Determines whether the dropdown should open upward based on available viewport space.
 * @param {React.RefObject} containerRef - Ref to the dropdown container element.
 * @param {boolean} isOpen - Whether the dropdown is currently open.
 * @param {number} menuMaxHeight - Max height of the dropdown menu (default 260).
 * @returns {boolean} True if the dropdown should open upward.
 */
function useOpenDirection(containerRef, isOpen, menuMaxHeight = 260) {
  const [openUpward, setOpenUpward] = useState(false);
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUpward = spaceBelow < menuMaxHeight && spaceAbove > spaceBelow;
    setOpenUpward(shouldOpenUpward);
  }, [isOpen, menuMaxHeight, containerRef]);
  return openUpward;
}

/**
 * Animated dropdown with optional search and grouped option support.
 * @param {object} props
 * @param {string} props.value - Currently selected value.
 * @param {Function} props.onChange - Called with the new value when an option is selected.
 * @param {string} props.placeholder - Text shown when nothing is selected.
 * @param {Array|string[]} props.options - Flat string array or grouped `{ label, options }` array.
 * @param {boolean} [props.grouped=false] - Set true when options are grouped.
 * @param {boolean} [props.searchable=false] - Set true to show an inline search bar.
 * @param {string} [props.searchPlaceholder="Search..."] - Placeholder for the search input.
 * @param {string} [props.emptyMessage="Nothing found"] - Shown when the search has no results.
 * @param {number} [props.menuMaxHeight] - Optional max height for the dropdown menu.
 */
export default function AnimatedDropdown({ value, onChange, placeholder, options, grouped = false, searchable = false, searchPlaceholder = "Search...", emptyMessage = "Nothing found", menuMaxHeight, className }) {
  const { isOpen, query, setQuery, selectedLabel, handleSelect, handleToggle } = useDropdownState(options, grouped, placeholder, value, onChange);
  const containerRef = useRef(null);
  const openUpward = useOpenDirection(containerRef, isOpen, menuMaxHeight);
  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <DropdownButton selectedLabel={selectedLabel} value={value} isOpen={isOpen} onClick={handleToggle} />
      <DropdownMenu isOpen={isOpen} grouped={grouped} options={options} value={value} onSelect={handleSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage}
        openUpward={openUpward} menuMaxHeight={menuMaxHeight} />
    </div>
  );
}
