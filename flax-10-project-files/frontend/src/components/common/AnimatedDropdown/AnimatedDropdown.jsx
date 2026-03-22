/*
 * Animated dropdown with optional search and grouped option support.
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

/** Text input with a leading search icon, auto-focused on mount. */
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

/** Animated search icon that wiggles on mount inside the empty state. */
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

/** Shown when a search query matches no options. */
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

function filterGrouped(options, query) {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options
    .map(group => ({ ...group, options: group.options.filter(o => o.label.toLowerCase().includes(q)) }))
    .filter(group => group.options.length > 0);
}

function filterFlat(options, query) {
  if (!query.trim()) return options;
  const q = query.toLowerCase();
  return options.filter(o => {
    const label = typeof o === 'string' ? o : o.label;
    return label.toLowerCase().includes(q);
  });
}

/** Animated checkmark shown next to the currently selected item. */
function CheckMark() {
  return (
    <motion.div {...checkmarkMotion}>
      <Check size={14} />
    </motion.div>
  );
}

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

function DropdownButton({ selectedLabel, value, isOpen, onClick, triggerClassName = "" }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.99 }} onClick={onClick} className={triggerClassName ? `${styles.dropdownBtn} ${triggerClassName}` : styles.dropdownBtn}>
      <span style={{ color: value ? 'inherit' : 'var(--muted)' }}>{selectedLabel}</span>
      <motion.div animate={{ rotate: isOpen ? 0 : 180 }} transition={chevronRotateTransition}>
        <ChevronDown size={16} />
      </motion.div>
    </motion.button>
  );
}

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

function buildMenuStyle(openUpward, usePortal, coords, menuMaxHeight) {
  const style = openUpward ? { bottom: '100%', top: 'auto', marginBottom: 4 } : {};
  if (usePortal && coords) {
    const top = openUpward ? 'auto' : coords.top + 4;
    const bottom = openUpward ? window.innerHeight - coords.top + 4 : 'auto';
    Object.assign(style, { position: 'fixed', top, bottom, left: coords.left, width: 'max-content', minWidth: coords.width, zIndex: 10001, margin: 0 });
  }
  if (menuMaxHeight) style.maxHeight = menuMaxHeight;
  return style;
}

function DropdownPanel({
  grouped, filteredOptions, value, onSelect,
  searchable, query, setQuery, searchPlaceholder, emptyMessage,
  openUpward, menuMaxHeight, hideCheckmark, align, usePortal, coords, menuRef
}) {
  const menuStyle = buildMenuStyle(openUpward, usePortal, coords, menuMaxHeight);
  const alignCls = align === 'right' ? styles.alignRight : styles.alignLeft;
  return (
    <motion.div ref={menuRef} data-dropdown-portal="true"
      {...getDropdownPanelMotion(openUpward)}
      className={`${styles.dropdownMenu} ${alignCls}`} style={menuStyle}>
      <DropdownContent grouped={grouped} filteredOptions={filteredOptions} value={value} onSelect={onSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage} hideCheckmark={hideCheckmark} />
    </motion.div>
  );
}

function DropdownMenu({
  isOpen, grouped, options, value, onSelect, searchable, query, setQuery,
  searchPlaceholder, emptyMessage, openUpward, menuMaxHeight, hideCheckmark, align,
  usePortal, coords, menuRef
}) {
  const filteredOptions = searchable ? (grouped ? filterGrouped(options, query) : filterFlat(options, query)) : options;
  const menu = (
    <AnimatePresence>
      {isOpen && <DropdownPanel grouped={grouped} filteredOptions={filteredOptions} value={value} onSelect={onSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage} openUpward={openUpward} menuMaxHeight={menuMaxHeight}
        hideCheckmark={hideCheckmark} usePortal={usePortal} coords={coords} align={align} menuRef={menuRef} />}
    </AnimatePresence>
  );
  if (usePortal && isOpen) return createPortal(menu, document.body);
  return menu;
}

function useDropdownOptions(options, grouped) {
  return grouped
    ? options.flatMap(g => g.options.map(o => ({ ...o, group: g.label })))
    : options.map(o => typeof o === 'string' ? { value: o, label: o } : o);
}

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

function computeOpenDirection(rect, menuMaxHeight, allowFlipUpward) {
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const shouldOpenUpward = allowFlipUpward && spaceBelow < menuMaxHeight && spaceAbove > spaceBelow;
  return {
    shouldOpenUpward,
    coords: { top: shouldOpenUpward ? rect.top : rect.bottom, left: rect.left, width: rect.width },
  };
}

/** Determines whether the dropdown should open upward based on available viewport space. */
function useOpenDirection(containerRef, isOpen, menuMaxHeight = 260, allowFlipUpward = false) {
  const [openUpward, setOpenUpward] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const update = () => {
      const { shouldOpenUpward, coords: c } = computeOpenDirection(containerRef.current.getBoundingClientRect(), menuMaxHeight, allowFlipUpward);
      setOpenUpward(shouldOpenUpward);
      setCoords(c);
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('scroll', update, true); window.removeEventListener('resize', update); };
  }, [isOpen, menuMaxHeight, containerRef, allowFlipUpward]);

  return { openUpward, coords };
}

function makeOutsideClickListener(containerRef, menuRef, setIsOpen) {
  return (event) => {
    const isInside = containerRef.current?.contains(event.target);
    const isInsideMenu = menuRef.current?.contains(event.target);
    if (!isInside && !isInsideMenu) setIsOpen(false);
  };
}

function useClickOutside(containerRef, menuRef, setIsOpen, openOnHover) {
  useEffect(() => {
    if (openOnHover) return;
    const listener = makeOutsideClickListener(containerRef, menuRef, setIsOpen);
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [openOnHover, setIsOpen, containerRef, menuRef]);
}

function useHoverHandlers(openOnHover, setIsOpen, timeoutRef) {
  const handleMouseEnter = () => {
    if (!openOnHover) return;
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };
  const handleMouseLeave = () => {
    if (!openOnHover) return;
    timeoutRef.current = setTimeout(() => setIsOpen(false), 150);
  };
  return { handleMouseEnter, handleMouseLeave };
}

function useDropdownRefs() {
  return { containerRef: useRef(null), menuRef: useRef(null), timeoutRef: useRef(null) };
}

function DropdownTrigger({ customTrigger, handleToggle, openOnHover, selectedLabel, value, isOpen, triggerClassName }) {
  if (customTrigger) {
    return (
      <div onClick={handleToggle} style={{ display: 'inline-flex', cursor: openOnHover ? 'default' : 'pointer' }}>
        {customTrigger}
      </div>
    );
  }
  return <DropdownButton selectedLabel={selectedLabel} value={value} isOpen={isOpen} onClick={handleToggle} triggerClassName={triggerClassName} />;
}

/** Animated dropdown with optional search and grouped option support. */
export default function AnimatedDropdown({
  value, onChange, placeholder, options, grouped = false, searchable = false, searchPlaceholder = "Search...", emptyMessage = "Nothing found", menuMaxHeight, className,
  customTrigger, hideCheckmark = false, openOnHover = false, isOpen: forceOpen, onOpenChange, align = 'left', usePortal = false, allowFlipUpward = true, triggerClassName = ""
}) {
  const { containerRef, menuRef, timeoutRef } = useDropdownRefs();
  const { isOpen, setIsOpen, query, setQuery, selectedLabel, handleSelect, handleToggle } = useDropdownState(options, grouped, placeholder, value, onChange, openOnHover, forceOpen, onOpenChange);
  const { openUpward, coords } = useOpenDirection(containerRef, isOpen, menuMaxHeight, allowFlipUpward);
  const { handleMouseEnter, handleMouseLeave } = useHoverHandlers(openOnHover, setIsOpen, timeoutRef);
  useClickOutside(containerRef, menuRef, setIsOpen, openOnHover);
  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <DropdownTrigger customTrigger={customTrigger} handleToggle={handleToggle} openOnHover={openOnHover} selectedLabel={selectedLabel} value={value} isOpen={isOpen} triggerClassName={triggerClassName} />
      <DropdownMenu isOpen={isOpen} grouped={grouped} options={options} value={value} onSelect={handleSelect}
        searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder}
        emptyMessage={emptyMessage} openUpward={openUpward} menuMaxHeight={menuMaxHeight}
        hideCheckmark={hideCheckmark} align={align} usePortal={usePortal} coords={coords} menuRef={menuRef} />
    </div>
  );
}
