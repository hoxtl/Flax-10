/**
 * Multi-select dropdown component.
 */

import { MultiSelectDropdownView } from "./multi-select-dropdown/MultiSelectDropdownView";
import { useMultiSelectDropdown } from "./multi-select-dropdown/useMultiSelectDropdown";

export default function MultiSelectDropdown(props) {
  const normalizedProps = getDefaultProps(props);
  const dropdown = useMultiSelectDropdown(normalizedProps);
  return <MultiSelectDropdownView {...normalizedProps} {...dropdown} />;
}

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
}
