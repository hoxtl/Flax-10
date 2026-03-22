/**
 * Multi-select dropdown value and class helpers.
 */

import dropdownStyles from "../../common/AnimatedDropdown/AnimatedDropdown.module.css";
import pillStyles from "../MultiSelectDropdown.module.css";

export function normalizeOption(option) {
  return typeof option === "string" ? { value: option, label: option } : option;
}

export function getSelectedValues(value) {
  return Array.isArray(value) ? value : [];
}

export function getOptionLabel(options, value, fallback) {
  return options.find((option) => option.value === value)?.label || fallback;
}

export function getTriggerLabel(selected, options, placeholder, countLabel) {
  if (!selected.length) return placeholder;
  if (selected.length > 1) return `${selected.length} ${countLabel}`;
  return getOptionLabel(options, selected[0], placeholder);
}

export function toggleSelectedValue(selected, selectedSet, nextValue) {
  if (nextValue === "") return [];
  if (selectedSet.has(nextValue)) return selected.filter((value) => value !== nextValue);
  return [...selected, nextValue];
}

export function getMenuClassName(align, menuClassName, optionsAsPills, variant) {
  return [
    dropdownStyles.dropdownMenu,
    align === "right" ? dropdownStyles.alignRight : dropdownStyles.alignLeft,
    optionsAsPills && pillStyles.menuPillsGrid,
    variant === "modules" && pillStyles.modulesMenu,
    menuClassName,
  ].filter(Boolean).join(" ");
}

export function getOptionState(optionValue, selected, selectedSet, hideCheckboxForValues) {
  return {
    hideCheckbox: hideCheckboxForValues.includes(optionValue),
    isActive: optionValue === "" ? !selected.length : selectedSet.has(optionValue),
  };
}

export function getItemClassName(config) {
  const activeClassName = getActiveItemClassName(config);

  return [
    dropdownStyles.dropdownItem,
    config.optionsAsPills && pillStyles.itemPill,
    config.isModuleVariant && pillStyles.modulesItem,
    config.isModuleVariant && config.hideCheckbox && pillStyles.modulesItemManage,
    config.itemClassName,
    activeClassName,
    config.isActive && config.activeItemClassName,
  ].filter(Boolean).join(" ");
}

function getActiveItemClassName({ isActive, isModuleVariant, optionsAsPills }) {
  if (!isActive) return "";
  if (optionsAsPills) return pillStyles.itemPillActive;
  if (isModuleVariant) return pillStyles.modulesItemActive;
  return dropdownStyles.dropdownItemActive;
}
