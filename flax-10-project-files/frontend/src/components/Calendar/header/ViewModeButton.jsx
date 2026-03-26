/*
 * ViewModeButton.jsx
 * Dropdown trigger for switching calendar view modes.
 */

import { LayoutList } from "lucide-react";
import AnimatedDropdown from "../../common/animated_dropdown";
import styles from "./CalendarHeaderUtils.module.css";

function ViewModeTrigger() {
  return (
    <button
      type="button"
      className={styles.settingsBtn}
      title="View Mode"
      aria-label="View mode"
    >
      <LayoutList size={18} />
    </button>
  );
}

export function ViewModeButton({
  modes,
  activeMode,
  onChange,
  isMobile = false,
}) {
  return (
    <AnimatedDropdown
      className={styles.actionMenu}
      customTrigger={<ViewModeTrigger />}
      options={modes}
      value={activeMode}
      onChange={onChange}
      align="right"
      openOnHover={!isMobile}
    />
  );
}
