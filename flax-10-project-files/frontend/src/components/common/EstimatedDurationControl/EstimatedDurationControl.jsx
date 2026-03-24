import { useEffect, useState } from "react";
import TextInput from "../TextInput/TextInput";
import {
  MAX_ESTIMATE_MINUTES,
  MIN_ESTIMATE_MINUTES,
  POMODORO_BLOCK_MINUTES,
  normalizeEstimateMinutesInput,
} from "../../../pages/Tasks/utils/createTaskBarUtils";

const DEFAULT_PRESETS = [
  { value: 25, label: "25m", ariaLabel: "25 minutes" },
  { value: 50, label: "50m", ariaLabel: "50 minutes" },
];

export default function EstimatedDurationControl({
  valueMinutes,
  onChangeMinutes,
  presets = DEFAULT_PRESETS,
  ariaLabel = "Estimated duration",
  customInputAriaLabel = "Custom estimated minutes",
  classes = {},
}) {
  const [customMinutes, setCustomMinutes] = useState(String(valueMinutes ?? POMODORO_BLOCK_MINUTES));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    setCustomMinutes(String(valueMinutes ?? POMODORO_BLOCK_MINUTES));
  }, [valueMinutes, isEditing]);

  const commitCustomValue = () => {
    const normalized = normalizeEstimateMinutesInput(customMinutes, valueMinutes);
    setIsEditing(false);
    setCustomMinutes(String(normalized));
    onChangeMinutes?.(normalized);
  };

  const handleCustomChange = (event) => {
    setIsEditing(true);
    setCustomMinutes(event.target.value);
  };

  const handleCustomBlur = () => {
    commitCustomValue();
  };

  const handleCustomKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitCustomValue();
    }
  };

  const handlePresetClick = (value) => {
    setIsEditing(false);
    setCustomMinutes(String(value));
    onChangeMinutes?.(value);
  };

  const numericMinutes = Number(valueMinutes ?? POMODORO_BLOCK_MINUTES);
  const presetSelected = presets.some(({ value }) => value === numericMinutes);
  const customActive = isEditing || !presetSelected;

  const buttons = presets.map(({ value, label, ariaLabel: presetAriaLabel }) => (
    <button
      key={value}
      type="button"
      className={`${classes.button ?? ""} ${numericMinutes === value ? classes.buttonActive ?? "" : ""}`.trim()}
      onClick={() => handlePresetClick(value)}
      aria-label={presetAriaLabel}
      aria-pressed={numericMinutes === value}
    >
      {label}
    </button>
  ));

  return (
    <div className={classes.root} role="group" aria-label={ariaLabel}>
      {classes.buttonGroup ? (
        <div className={classes.buttonGroup}>
          {buttons}
        </div>
      ) : (
        buttons
      )}
      <TextInput
        type="number"
        min={MIN_ESTIMATE_MINUTES}
        max={MAX_ESTIMATE_MINUTES}
        value={customMinutes}
        onChange={handleCustomChange}
        onBlur={handleCustomBlur}
        onKeyDown={handleCustomKeyDown}
        className={`${classes.customInput ?? ""} ${customActive ? classes.customInputActive ?? "" : ""}`.trim()}
        inputClassName={classes.customInputField}
        leading={<span className={classes.leading}>Custom</span>}
        trailing={<span className={classes.trailing}>min</span>}
        aria-label={customInputAriaLabel}
      />
    </div>
  );
}
