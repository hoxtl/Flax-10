/**
 * Multi-select dropdown composition hook.
 */

import { useMemo } from "react";
import { createHoverHandlers, useCloseOnOutsideClick, useDropdownHoverTimeout, useDropdownRootRef } from "./useDropdownInteractions";
import { useDropdownOpenState } from "./useDropdownOpenState";
import { getSelectedValues, getTriggerLabel, normalizeOption, toggleSelectedValue } from "./multiSelectDropdownUtils";

export function useMultiSelectDropdown(props) {
  const { align, countLabel, hideCheckboxForValues, isOpen, itemClassName, menuClassName, onChange, onOpenChange, openOnHover, options, placeholder, showCheckboxes, value, variant } = props;
  const { isOpen: menuOpen, updateOpen } = useDropdownOpenState(isOpen, onOpenChange);
  const rootRef = useDropdownRootRef();
  const hoverTimeoutRef = useDropdownHoverTimeout();
  const optionsList = useMemo(() => options.map(normalizeOption), [options]);
  const selected = getSelectedValues(value);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  useCloseOnOutsideClick(menuOpen, rootRef, updateOpen);
  return buildDropdownState({ align, countLabel, hideCheckboxForValues, hoverTimeoutRef, itemClassName, menuClassName, menuOpen, onChange, openOnHover, optionsList, placeholder, rootRef, selected, selectedSet, showCheckboxes, updateOpen, variant });
}

function buildDropdownState(config) {
  return {
    ...config,
    hoverHandlers: createHoverHandlers(config.openOnHover, config.hoverTimeoutRef, config.updateOpen),
    isModuleVariant: config.variant === "modules",
    onRemovePill: (value) => config.onChange(toggleSelectedValue(config.selected, config.selectedSet, value)),
    onToggle: (value) => config.onChange(toggleSelectedValue(config.selected, config.selectedSet, value)),
    triggerLabel: getTriggerLabel(config.selected, config.optionsList, config.placeholder, config.countLabel),
  };
}
