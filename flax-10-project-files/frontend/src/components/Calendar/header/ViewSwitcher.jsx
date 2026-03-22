/*
 * ViewSwitcher.jsx
 * Segmented control for calendar view modes.
 */

import { SegmentedControl } from "../../common/SegmentedControl/SegmentedControl";

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
