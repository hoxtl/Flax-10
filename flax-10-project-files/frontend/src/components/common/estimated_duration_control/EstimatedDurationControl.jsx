import { useEffect, useMemo, useState } from "react";
import TextInput from "../text_input/TextInput";
import {
  MAX_ESTIMATE_MINUTES,
  MIN_ESTIMATE_MINUTES,
  POMODORO_BLOCK_MINUTES,
  normalizeEstimateMinutesInput,
} from "../../../pages/tasks/utils/createTaskBarUtils";

const DEFAULT_PRESETS = [
  { value: 25, label: "25m", ariaLabel: "25 minutes" },
  { value: 50, label: "50m", ariaLabel: "50 minutes" },
];

export default function EstimatedDurationControl(props) {
  const ui = useEstimatedDurationUI(props);
  return (
    <div className={ui.classes.root} role="group" aria-label={ui.ariaLabel}>
      {ui.renderPresetButtons()}
      <TextInput {...ui.inputProps} />
    </div>
  );
}

function useEstimatedDurationUI(props) {
  const config = useMemo(() => normalizeProps(props), [props]);
  const state = useCustomMinutesState(config.valueMinutes, config.onChangeMinutes);
  return {
    ariaLabel: config.ariaLabel,
    classes: config.classes,
    renderPresetButtons: () => renderPresetButtons(config, state),
    inputProps: buildCustomInputProps(config, state),
  };
}

function normalizeProps(props) {
  return {
    valueMinutes: props.valueMinutes,
    onChangeMinutes: props.onChangeMinutes,
    presets: props.presets ?? DEFAULT_PRESETS,
    ariaLabel: props.ariaLabel ?? "Estimated duration",
    customInputAriaLabel: props.customInputAriaLabel ?? "Custom estimated minutes",
    classes: props.classes ?? {},
  };
}

function useCustomMinutesState(valueMinutes, onChangeMinutes) {
  const baseValue = valueMinutes ?? POMODORO_BLOCK_MINUTES;
  const [customMinutes, setCustomMinutes] = useState(String(baseValue));
  const [isEditing, setIsEditing] = useState(false);
  useSyncedCustomMinutes(isEditing, valueMinutes, setCustomMinutes);
  const commit = () => commitCustomMinutes(customMinutes, valueMinutes, onChangeMinutes, setCustomMinutes, setIsEditing);
  return buildCustomState({ customMinutes, setCustomMinutes, setIsEditing, onChangeMinutes, commit, baseValue, isEditing });
}

function useSyncedCustomMinutes(isEditing, valueMinutes, setCustomMinutes) {
  useEffect(() => {
    if (isEditing) return;
    const fallback = valueMinutes ?? POMODORO_BLOCK_MINUTES;
    setCustomMinutes(String(fallback));
  }, [valueMinutes, isEditing, setCustomMinutes]);
}

function commitCustomMinutes(customMinutes, valueMinutes, onChangeMinutes, setCustomMinutes, setIsEditing) {
  const normalized = normalizeEstimateMinutesInput(customMinutes, valueMinutes);
  setIsEditing(false);
  setCustomMinutes(String(normalized));
  onChangeMinutes?.(normalized);
}

function buildCustomState({ customMinutes, setCustomMinutes, setIsEditing, onChangeMinutes, commit, baseValue, isEditing }) {
  const numericMinutes = Number(baseValue);
  const handlePreset = (value) => {
    setIsEditing(false);
    setCustomMinutes(String(value));
    onChangeMinutes?.(value);
  };
  return {
    customMinutes,
    isEditing,
    numericMinutes,
    commit,
    handlePreset,
    handleChange: (event) => {
      setIsEditing(true);
      setCustomMinutes(event.target.value);
    },
  };
}

function renderPresetButtons(config, state) {
  const buttons = config.presets.map((preset) => buildPresetButton(preset, state, config.classes));
  return config.classes.buttonGroup ? <div className={config.classes.buttonGroup}>{buttons}</div> : buttons;
}

function buildPresetButton(preset, state, classes) {
  const isActive = state.numericMinutes === preset.value;
  const buttonClass = `${classes.button ?? ""} ${isActive ? classes.buttonActive ?? "" : ""}`.trim();
  return (
    <button
      key={preset.value}
      type="button"
      className={buttonClass}
      onClick={() => state.handlePreset(preset.value)}
      aria-label={preset.ariaLabel}
      aria-pressed={isActive}
    >
      {preset.label}
    </button>
  );
}

function buildCustomInputProps(config, state) {
  const customActive = state.isEditing || !config.presets.some(({ value }) => value === state.numericMinutes);
  const classes = `${config.classes.customInput ?? ""} ${customActive ? config.classes.customInputActive ?? "" : ""}`.trim();
  return {
    type: "number",
    min: MIN_ESTIMATE_MINUTES,
    max: MAX_ESTIMATE_MINUTES,
    value: state.customMinutes,
    onChange: state.handleChange,
    onBlur: state.commit,
    onKeyDown: (event) => handleCustomKey(event, state.commit),
    className: classes,
    inputClassName: config.classes.customInputField,
    leading: <span className={config.classes.leading}>Custom</span>,
    trailing: <span className={config.classes.trailing}>min</span>,
    "aria-label": config.customInputAriaLabel,
  };
}

function handleCustomKey(event, commit) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  commit();
}
