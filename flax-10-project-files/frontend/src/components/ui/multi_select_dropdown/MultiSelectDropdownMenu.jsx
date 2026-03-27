/**
 * Multi-select dropdown menu view.
 */

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import FilterCheckbox from "../../common/filter_checkbox/FilterCheckbox";
import pillStyles from "../styles/MultiSelectDropdown.module.css";
import { getItemClassName, getMenuClassName, getOptionState } from "./multiSelectDropdownUtils";

const MotionButton = motion.button;
const MotionDiv = motion.div;

export function MultiSelectDropdownMenu(props) {
  const className = getMenuClassName(props.align, props.menuClassName, props.optionsAsPills, props.variant);

  return (
    <AnimatePresence>
      {props.isOpen && <DropdownMenuBody {...props} className={className} />}
    </AnimatePresence>
  );
}

function DropdownMenuBody({ activeItemClassName, className, hideCheckboxForValues, isModuleVariant, itemClassName, onToggle, options, optionsAsPills, selected, selectedSet, showCheckboxes }) {
  return (
    <MotionDiv initial={{ opacity: 0, y: -6, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -6, scaleY: 0.95 }} transition={{ duration: 0.16 }} style={{ originY: 0 }} className={className}>
      {options.map((option) => <DropdownOption key={option.value || "__all__"} activeItemClassName={activeItemClassName} hideCheckboxForValues={hideCheckboxForValues} isModuleVariant={isModuleVariant} itemClassName={itemClassName} onToggle={onToggle} option={option} optionsAsPills={optionsAsPills} selected={selected} selectedSet={selectedSet} showCheckboxes={showCheckboxes} />)}
    </MotionDiv>
  );
}

function DropdownOption({ activeItemClassName, hideCheckboxForValues, isModuleVariant, itemClassName, onToggle, option, optionsAsPills, selected, selectedSet, showCheckboxes }) {
  const optionState = getOptionState(option.value, selected, selectedSet, hideCheckboxForValues);
  const className = getItemClassName({ activeItemClassName, hideCheckbox: optionState.hideCheckbox, isActive: optionState.isActive, isModuleVariant, itemClassName, optionsAsPills });

  return (
    <MotionButton type="button" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.14 }} onClick={() => onToggle(option.value)} className={className}>
      <OptionLeadingIcon hideCheckbox={optionState.hideCheckbox} isActive={optionState.isActive} showCheckboxes={showCheckboxes} />
      <span className={isModuleVariant ? pillStyles.modulesItemLabel : ""}>{option.label}</span>
      <OptionTrailingIcon isActive={optionState.isActive} showCheckboxes={showCheckboxes} />
    </MotionButton>
  );
}

function OptionLeadingIcon({ hideCheckbox, isActive, showCheckboxes }) {
  if (!showCheckboxes || hideCheckbox) return null;
  return (
    <span className={pillStyles.modulesCheckboxWrap} aria-hidden>
      <FilterCheckbox className={pillStyles.modulesCheckbox} checked={isActive} readOnly tabIndex={-1} />
    </span>
  );
}

function OptionTrailingIcon({ isActive, showCheckboxes }) {
  if (showCheckboxes || !isActive) return null;
  return <Check size={13} strokeWidth={2.5} aria-hidden />;
}
