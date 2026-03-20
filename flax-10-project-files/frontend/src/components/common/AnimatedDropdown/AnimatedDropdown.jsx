/**
 * AnimatedDropdown — shared animated dropdown component with optional grouped options
 * and an inline search bar. Used throughout the onboarding and module selection flows.
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Search } from "lucide-react";
import {
  checkmarkMotion,
  chevronRotateTransition,
  getDropdownItemMotion,
  getDropdownPanelMotion,
} from "../motion/transitions";
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
    <motion.div {...checkmarkMotion}>
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
function GroupedOptionItem({ opt, value, onSelect, index, hideCheckmark }) {
  return (
    <motion.button type="button"
      {...getDropdownItemMotion(index)}
      onClick={() => onSelect(opt.value)}
      className={`${styles.dropdownItem} ${value === opt.value && !hideCheckmark ? styles.dropdownItemActive : ''}`}>
      <span>{opt.label}</span>
      {value === opt.value && !hideCheckmark && <CheckMark />}
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
function GroupedOptions({ options, value, onSelect, hideCheckmark }) {
  return options.map((group) => (
    <div key={group.label}>
      <div className={styles.dropdownGroup}>{group.label}</div>
      {group.options.map((opt, i) => (
        <GroupedOptionItem key={opt.value} opt={opt} value={value} onSelect={onSelect} index={i} hideCheckmark={hideCheckmark} />
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
function FlatOptions({ options, value, onSelect, hideCheckmark }) {
  return options.map((opt, i) => {
    const optValue = typeof opt === 'string' ? opt : opt.value;
    const optLabel = typeof opt === 'string' ? opt : opt.label;
    return (
      <motion.button type="button" key={optValue ?? i}
        {...getDropdownItemMotion(i)}
        onClick={() => onSelect(optValue)}
        className={`${styles.dropdownItem} ${value === optValue && !hideCheckmark ? styles.dropdownItemActive : ''}`}
      >
        <span>{optLabel}</span>
        {value === optValue && !hideCheckmark && <CheckMark />}
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
      <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={chevronRotateTransition}>
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
  searchable, query, setQuery, searchPlaceholder, emptyMessage, hideCheckmark
}) {
  const isEmpty = searchable && filteredOptions.length === 0;
  return (
    <>
      {searchable && <SearchInput query={query} setQuery={setQuery} placeholder={searchPlaceholder} />}
      {isEmpty && <EmptyState query={query} emptyMessage={emptyMessage} />}
      {!isEmpty && grouped && <GroupedOptions options={filteredOptions} value={value} onSelect={onSelect} hideCheckmark={hideCheckmark} />}
      {!isEmpty && !grouped && <FlatOptions options={filteredOptions} value={value} onSelect={onSelect} hideCheckmark={hideCheckmark} />}
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
  searchable, query, setQuery, searchPlaceholder, emptyMessage, openUpward, menuMaxHeight, hideCheckmark,
  align, usePortal, coords
}) {
  const menuStyle = openUpward ? { bottom: '100%', top: 'auto', marginBottom: 4 } : {};

  if (usePortal && coords) {
    const portalTop = openUpward ? 'auto' : coords.top + 4;
    const portalBottom = openUpward ? window.innerHeight - coords.top + 4 : 'auto';
    Object.assign(menuStyle, {
      position: 'fixed',
      top: portalTop,
      bottom: portalBottom,
      left: coords.left,
      width: 'max-content',
      minWidth: coords.width,
      zIndex: 10001,
      margin: 0
    });
  }

  if (menuMaxHeight) menuStyle.maxHeight = menuMaxHeight;

  const alignCls = align === 'right' ? styles.alignRight : styles.alignLeft;

  return (
    <motion.div
      {...getDropdownPanelMotion(openUpward)}
      className={`${styles.dropdownMenu} ${alignCls}`} style={menuStyle}>
      <DropdownContent grouped={grouped} filteredOptions={filteredOptions} value={value} onSelect={onSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage} hideCheckmark={hideCheckmark} />
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
function DropdownMenu({
  isOpen, grouped, options, value, onSelect, searchable, query, setQuery,
  searchPlaceholder, emptyMessage, openUpward, menuMaxHeight, hideCheckmark, align,
  usePortal, coords
}) {
  const filteredOptions = searchable ? (grouped ? filterGrouped(options, query) : filterFlat(options, query)) : options;
  const menu = (
    <AnimatePresence>
      {isOpen && <DropdownPanel grouped={grouped} filteredOptions={filteredOptions} value={value} onSelect={onSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage}
        openUpward={openUpward} menuMaxHeight={menuMaxHeight} hideCheckmark={hideCheckmark}
        usePortal={usePortal} coords={coords} align={align} />}
    </AnimatePresence>
  );

  if (usePortal && isOpen) {
    return createPortal(menu, document.body);
  }
  return menu;
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
 */
function useDropdownState(opts, grp, ph, val, onChange, hover, forceOpen, onOpenChange) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isCtrl = forceOpen !== undefined;
  const isOpen = isCtrl ? forceOpen : internalOpen;
  const updateOpen = (v) => {
    const next = typeof v === 'function' ? v(isOpen) : v;
    if (!isCtrl) setInternalOpen(next);
    if (onOpenChange) onOpenChange(next);
  };
  const [query, setQuery] = useState("");
  const allOptions = useDropdownOptions(opts, grp);
  const selectedLabel = allOptions.find(o => o.value === val)?.label || ph;
  const handleSelect = (v) => { onChange(v); updateOpen(false); setQuery(""); };
  const handleToggle = () => { if (!hover) { updateOpen(!isOpen); setQuery(""); } };
  return { isOpen, setIsOpen: updateOpen, query, setQuery, selectedLabel, handleSelect, handleToggle };
}

/**
 * Determines whether the dropdown should open upward based on available viewport space.
 * @param {React.RefObject} containerRef - Ref to the dropdown container element.
 * @param {boolean} isOpen - Whether the dropdown is currently open.
 * @param {number} menuMaxHeight - Max height of the dropdown menu (default 260).
 * @param {boolean} allowFlipUpward - Whether the menu is allowed to flip upward.
 * @returns {boolean} True if the dropdown should open upward.
 */
function useOpenDirection(containerRef, isOpen, menuMaxHeight = 260, allowFlipUpward = false) {
  const [openUpward, setOpenUpward] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const update = () => {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUpward =
        allowFlipUpward && spaceBelow < menuMaxHeight && spaceAbove > spaceBelow;
      setOpenUpward(shouldOpenUpward);
      setCoords({
        top: shouldOpenUpward ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    }
  }, [isOpen, menuMaxHeight, containerRef, allowFlipUpward]);
  return { openUpward, coords };
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
 * @param {boolean} [props.openOnHover] - Whether the dropdown should open on hover.
 * @param {boolean} [props.usePortal=true] - Whether to render the menu in a portal.
 * @param {boolean} [props.allowFlipUpward=false] - Whether the menu can flip upward.
 */
export default function AnimatedDropdown({
  value, onChange, placeholder, options,
  grouped = false, searchable = false, searchPlaceholder = "Search...",
  emptyMessage = "Nothing found", menuMaxHeight, className,
  customTrigger, hideCheckmark = false, openOnHover = false,
  isOpen: forceOpen, onOpenChange, align = 'left', usePortal = false,
  allowFlipUpward = false
}) {
  const { isOpen, setIsOpen, query, setQuery, selectedLabel, handleSelect, handleToggle } = useDropdownState(
    options, grouped, placeholder, value, onChange, openOnHover, forceOpen, onOpenChange
  );
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const { openUpward, coords } = useOpenDirection(
    containerRef,
    isOpen,
    menuMaxHeight,
    allowFlipUpward
  );

  const handleMouseEnter = () => {
    if (openOnHover) {
      clearTimeout(timeoutRef.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (openOnHover) {
      timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
    }
  };

  useEffect(() => {
    if (!openOnHover) {
      const listener = (event) => {
        const isInside = containerRef.current?.contains(event.target);
        // If portaled, we also check if the click was inside the menu in the body
        const dropdownMenu = document.querySelector(`.${styles.dropdownMenu}`);
        const isInsideMenu = dropdownMenu?.contains(event.target);

        if (!isInside && !isInsideMenu) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", listener);
      return () => document.removeEventListener("mousedown", listener);
    }
  }, [openOnHover, setIsOpen]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {customTrigger ? (
        <div onClick={handleToggle} style={{ display: 'inline-flex', cursor: openOnHover ? 'default' : 'pointer' }}>
          {customTrigger}
        </div>
      ) : (
        <DropdownButton selectedLabel={selectedLabel} value={value} isOpen={isOpen} onClick={handleToggle} />
      )}
      <DropdownMenu isOpen={isOpen} grouped={grouped} options={options} value={value} onSelect={handleSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage}
        openUpward={openUpward} menuMaxHeight={menuMaxHeight} hideCheckmark={hideCheckmark}
        align={align} usePortal={usePortal} coords={coords} />
    </div>
  );
}
