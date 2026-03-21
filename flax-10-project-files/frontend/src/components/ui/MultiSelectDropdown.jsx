<<<<<<< HEAD
/**
 * Multi-select dropdown component.
 */
=======
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import dropdownStyles from "../common/AnimatedDropdown/AnimatedDropdown.module.css";
import FilterCheckbox from "../common/FilterCheckbox/FilterCheckbox";
import pillStyles from "./MultiSelectDropdown.module.css";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

import { MultiSelectDropdownView } from "./multi_select_dropdown/MultiSelectDropdownView";
import { useMultiSelectDropdown } from "./multi_select_dropdown/useMultiSelectDropdown";

export default function MultiSelectDropdown(props) {
  const normalizedProps = getDefaultProps(props);
  const dropdown = useMultiSelectDropdown(normalizedProps);
  return <MultiSelectDropdownView {...normalizedProps} {...dropdown} />;
}

<<<<<<< HEAD
function getDefaultProps(props) {
  return {
    value: [],
    placeholder: "All",
    options: [],
    className: "",
    countLabel: "selected",
    displayAsPills: false,
    optionsAsPills: false,
    openOnHover: false,
    align: "left",
    menuClassName: "",
    itemClassName: "",
    activeItemClassName: "",
    variant: "default",
    showCheckboxes: false,
    hideCheckboxForValues: [],
    ...props,
  };
=======
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
  openOnHover = false,
  align = "left",
  isOpen: forceOpen,
  onOpenChange,
  menuClassName = "",
  itemClassName = "",
  activeItemClassName = "",
  variant = "default",
  showCheckboxes = false,
  hideCheckboxForValues = [],
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
  const hoverTimeoutRef = useRef(null);
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
  const isModuleVariant = variant === "modules";

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
        className={dropdownStyles.dropdownBtn}
      >
        <span style={{ color: selected.length ? "inherit" : "var(--muted)" }}>
          {triggerLabel}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className={pillStyles.chevron}
        >
          <ChevronDown size={15} strokeWidth={2} aria-hidden />
        </motion.span>
      </motion.button>
    );
  };

  const handleMouseEnter = () => {
    if (!openOnHover) return;
    clearTimeout(hoverTimeoutRef.current);
    updateOpen(true);
  };

  const handleMouseLeave = () => {
    if (!openOnHover) return;
    hoverTimeoutRef.current = setTimeout(() => updateOpen(false), 140);
  };

  const handleCustomTriggerClick = () => {
    updateOpen((o) => !o);
  };

  const menuAlignClass = align === "right" ? dropdownStyles.alignRight : dropdownStyles.alignLeft;
  const mergedMenuClassName = [
    dropdownStyles.dropdownMenu,
    menuAlignClass,
    optionsAsPills ? pillStyles.menuPillsGrid : "",
    isModuleVariant ? pillStyles.modulesMenu : "",
    menuClassName,
  ].filter(Boolean).join(" ");

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {customTrigger ? (
        <div onClick={handleCustomTriggerClick} style={{ display: "inline-flex", cursor: "pointer" }}>
          {customTrigger}
        </div>
      ) : (
        renderTrigger()
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.95 }}
            transition={{ duration: 0.16 }}
            style={{ originY: 0 }}
            className={mergedMenuClassName}
          >
            {opts.map((opt) => {
              const isActive = opt.value === "" ? selected.length === 0 : selectedSet.has(opt.value);
              const hideCheckbox = hideCheckboxForValues.includes(opt.value);
              const mergedItemClassName = [
                dropdownStyles.dropdownItem,
                optionsAsPills ? pillStyles.itemPill : "",
                isModuleVariant ? pillStyles.modulesItem : "",
                isModuleVariant && hideCheckbox ? pillStyles.modulesItemManage : "",
                itemClassName,
                isActive
                  ? (
                    optionsAsPills
                      ? pillStyles.itemPillActive
                      : isModuleVariant
                        ? pillStyles.modulesItemActive
                        : dropdownStyles.dropdownItemActive
                  )
                  : "",
                isActive ? activeItemClassName : "",
              ].filter(Boolean).join(" ");
              return (
                <motion.button
                  key={opt.value || "__all__"}
                  type="button"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.14 }}
                  onClick={() => handleToggle(opt.value)}
                  className={mergedItemClassName}
                >
                  {showCheckboxes && !hideCheckbox && (
                    <span className={pillStyles.modulesCheckboxWrap} aria-hidden>
                      <FilterCheckbox
                        className={pillStyles.modulesCheckbox}
                        checked={isActive}
                        readOnly
                        tabIndex={-1}
                      />
                    </span>
                  )}
                  <span className={isModuleVariant ? pillStyles.modulesItemLabel : ""}>{opt.label}</span>
                  {!showCheckboxes && isActive && (
                    <span>
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
