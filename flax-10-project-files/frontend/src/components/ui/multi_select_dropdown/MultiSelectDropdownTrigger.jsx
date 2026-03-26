/**
 * Multi-select dropdown trigger views.
 */

import { motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import dropdownStyles from "../../common/animated_dropdown/AnimatedDropdown.module.css";
import pillStyles from "../MultiSelectDropdown.module.css";
import { getOptionLabel } from "./multiSelectDropdownUtils";

const MotionButton = motion.button;
const MotionSpan = motion.span;

export function MultiSelectDropdownTrigger(props) {
  if (props.customTrigger) return <CustomTrigger {...props} />;
  if (props.displayAsPills) return <PillsTrigger {...props} />;
  return <DefaultTrigger {...props} />;
}

const CUSTOM_TRIGGER_STYLE = { display: "inline-flex", cursor: "pointer" };

function CustomTrigger({ customTrigger, updateOpen }) {
  return (
    <div onClick={() => updateOpen((open) => !open)} style={CUSTOM_TRIGGER_STYLE}>
      {customTrigger}
    </div>
  );
}

function DefaultTrigger({ isOpen, selected, triggerLabel, updateOpen }) {
  return (
    <MotionButton type="button" whileTap={{ scale: 0.99 }} onClick={() => updateOpen((open) => !open)} className={dropdownStyles.dropdownBtn}>
      <span style={{ color: selected.length ? "inherit" : "var(--muted)" }}>{triggerLabel}</span>
      <ChevronIcon isOpen={isOpen} />
    </MotionButton>
  );
}

function PillsTrigger(props) {
  const { isOpen, onRemovePill, options, placeholder, selected, updateOpen } = props;

  return (
    <div className={pillStyles.triggerWithPills} onClick={() => updateOpen((open) => !open)} role="button" tabIndex={0} onKeyDown={(event) => handlePillsTriggerKeyDown(event, updateOpen)} aria-haspopup="listbox" aria-expanded={isOpen}>
      <PillsTriggerContent onRemovePill={onRemovePill} options={options} placeholder={placeholder} selected={selected} />
      <span className={pillStyles.triggerPillsDropdownBtn}>
        <ChevronIcon isOpen={isOpen} />
      </span>
    </div>
  );
}

function PillsTriggerContent({ onRemovePill, options, placeholder, selected }) {
  if (!selected.length) return <span className={pillStyles.triggerPillsPlaceholder}>{placeholder}</span>;
  return selected.map((value) => <SelectedPill key={value} label={getOptionLabel(options, value, value)} onRemovePill={onRemovePill} value={value} />);
}

function SelectedPill({ label, onRemovePill, value }) {
  return (
    <span className={pillStyles.pill} onClick={(event) => event.stopPropagation()}>
      <span>{label}</span>
      <button type="button" className={pillStyles.pillRemove} onClick={(event) => handlePillRemove(event, onRemovePill, value)} aria-label={`Remove ${label}`}>
        <X size={10} strokeWidth={2.5} />
      </button>
    </span>
  );
}

function ChevronIcon({ isOpen }) {
  return (
    <MotionSpan animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.22 }} className={pillStyles.chevron}>
      <ChevronDown size={15} strokeWidth={2} aria-hidden />
    </MotionSpan>
  );
}

function handlePillsTriggerKeyDown(event, updateOpen) {
  if (!isToggleKey(event.key)) return;
  event.preventDefault();
  updateOpen((open) => !open);
}

function isToggleKey(key) {
  return key === "Enter" || key === " ";
}

function handlePillRemove(event, onRemovePill, value) {
  event.stopPropagation();
  onRemovePill(value);
}
