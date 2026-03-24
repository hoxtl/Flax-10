/*
 * Animated dropdown with optional search and grouped option support.
 */

import { useEffect, useRef } from "react";
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
import { buildMenuStyle, getFilteredDropdownOptions, useAnimatedDropdownState } from "./useAnimatedDropdown";

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
  const filteredOptions = getFilteredDropdownOptions(options, grouped, searchable, query);
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

function DropdownTrigger({ customTrigger, handleToggle, openOnHover, selectedLabel, value, isOpen, triggerClassName }) {
  if (customTrigger) {
    const triggerStyle = { display: 'inline-flex', cursor: openOnHover ? 'default' : 'pointer' };
    return (
      <div onClick={handleToggle} style={triggerStyle}>
        {customTrigger}
      </div>
    );
  }
  return <DropdownButton selectedLabel={selectedLabel} value={value} isOpen={isOpen} onClick={handleToggle} triggerClassName={triggerClassName} />;
}

function useDropdownConfig(props) {
  return useAnimatedDropdownState({
    options: props.options,
    grouped: props.grouped,
    placeholder: props.placeholder,
    value: props.value,
    onChange: props.onChange,
    openOnHover: props.openOnHover,
    isOpen: props.forceOpen,
    onOpenChange: props.onOpenChange,
    menuMaxHeight: props.menuMaxHeight,
    allowFlipUpward: props.allowFlipUpward,
  });
}

export default function AnimatedDropdown(props) {
  const { value, options, grouped = false, searchable = false, searchPlaceholder = "Search...", emptyMessage = "Nothing found", menuMaxHeight, className, customTrigger, hideCheckmark = false, openOnHover = false, isOpen: forceOpen, onOpenChange, align = 'left', usePortal = false, allowFlipUpward = true, triggerClassName = "" } = props;
  const state = useDropdownConfig({ ...props, forceOpen, allowFlipUpward });
  const { containerRef, menuRef, isOpen, query, setQuery, selectedLabel, handleSelect, handleToggle, openUpward, coords, handleMouseEnter, handleMouseLeave } = state;
  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <DropdownTrigger customTrigger={customTrigger} handleToggle={handleToggle} openOnHover={openOnHover} selectedLabel={selectedLabel} value={value} isOpen={isOpen} triggerClassName={triggerClassName} />
      <DropdownMenu isOpen={isOpen} grouped={grouped} options={options} value={value} onSelect={handleSelect} searchable={searchable} query={query} setQuery={setQuery} searchPlaceholder={searchPlaceholder} emptyMessage={emptyMessage} openUpward={openUpward} menuMaxHeight={menuMaxHeight} hideCheckmark={hideCheckmark} align={align} usePortal={usePortal} coords={coords} menuRef={menuRef} />
    </div>
  );
}
