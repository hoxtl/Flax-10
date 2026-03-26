/*
 * ViewSwitcher.jsx
 * Segmented control for calendar view modes.
 */

import { SegmentedControl } from "../../common/segmented_control/SegmentedControl";

export function ViewSwitcher({ modes, activeMode, onChange }) {
  return (
    <SegmentedControl
      options={modes}
      value={activeMode}
      onChange={onChange}
      variant="solid"
    />
  );
}
