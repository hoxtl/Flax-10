/**
 * Multi-select dropdown assembled view.
 */

import { MultiSelectDropdownMenu } from "./MultiSelectDropdownMenu";
import { MultiSelectDropdownTrigger } from "./MultiSelectDropdownTrigger";

export function MultiSelectDropdownView(props) {
  const { activeItemClassName, align, className, customTrigger, displayAsPills, hideCheckboxForValues, hoverHandlers, isModuleVariant, itemClassName, menuClassName, menuOpen, onRemovePill, onToggle, optionsAsPills, optionsList, placeholder, rootRef, selected, selectedSet, showCheckboxes, triggerLabel, updateOpen, variant } = props;

  return (
    <div ref={rootRef} className={className} style={{ position: "relative" }} onMouseEnter={hoverHandlers.onMouseEnter} onMouseLeave={hoverHandlers.onMouseLeave}>
      <MultiSelectDropdownTrigger customTrigger={customTrigger} displayAsPills={displayAsPills} isOpen={menuOpen} onRemovePill={onRemovePill} options={optionsList} placeholder={placeholder} selected={selected} triggerLabel={triggerLabel} updateOpen={updateOpen} />
      <MultiSelectDropdownMenu activeItemClassName={activeItemClassName} align={align} hideCheckboxForValues={hideCheckboxForValues} isModuleVariant={isModuleVariant} isOpen={menuOpen} itemClassName={itemClassName} menuClassName={menuClassName} onToggle={onToggle} options={optionsList} optionsAsPills={optionsAsPills} selected={selected} selectedSet={selectedSet} showCheckboxes={showCheckboxes} variant={variant} />
    </div>
  );
}
