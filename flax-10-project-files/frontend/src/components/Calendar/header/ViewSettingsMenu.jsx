/*
 * ViewSettingsMenu.jsx
 * Display mode selector for grid, list, and table views.
 */

import { Settings2 } from "lucide-react";
import AnimatedDropdown from "../../common/AnimatedDropdown";
import styles from "./CalendarHeaderUtils.module.css";

const DISPLAY_MODE_OPTIONS = [
  { label: "Grid View", value: "grid" },
  { label: "List View", value: "list" },
  { label: "Table View", value: "table" },
];

const MOBILE_DISPLAY_OPTIONS = DISPLAY_MODE_OPTIONS.filter(
  ({ value }) => value !== "table",
);

function SettingsTrigger() {
  return (
    <button
      type="button"
      className={styles.settingsBtn}
      title="Display Mode"
      aria-label="Display mode"
    >
      <Settings2 size={18} />
    </button>
  );
}

function getDisplayOptions(isMobile) {
  return isMobile ? MOBILE_DISPLAY_OPTIONS : DISPLAY_MODE_OPTIONS;
}

export function ViewSettingsMenu({ activeMode, onViewChange, isMobile }) {
  return (
    <AnimatedDropdown
      className={styles.actionMenu}
      customTrigger={<SettingsTrigger />}
      options={getDisplayOptions(isMobile)}
      value={activeMode}
      onChange={onViewChange}
      align="right"
      openOnHover={!isMobile}
    />
  );
}
