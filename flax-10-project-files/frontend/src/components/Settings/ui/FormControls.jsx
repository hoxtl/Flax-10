/*
 * Shared form controls for settings inputs and selects.
 */
import styles from "../../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../../Common/AnimatedDropdown";
import FormTextInput from "./FormTextInput";

function RemainingCount({ remaining }) {
  return (
    <span style={{ color: "var(--muted)", fontSize: "0.9em", marginLeft: "5px" }}>
      ({remaining} characters remaining)
    </span>
  );
}

function FieldLabel({ id, label, maxLength, value }) {
  const remaining = maxLength ? maxLength - value.length : null;

  return (
    <label htmlFor={id}>
      {label}
      {maxLength ? <RemainingCount remaining={remaining} /> : null}
    </label>
  );
}

export function FormInput(props) {
  const {
    id,
    label,
    type = "text",
    value,
    onChange,
    required,
    name,
    maxLength,
    autoComplete,
  } = props;

  const inputProps = { type, id, name: name || id, value, onChange, required, maxLength, autoComplete };
  return <div className={styles.formGroup}><FieldLabel id={id} label={label} maxLength={maxLength} value={value} /><FormTextInput {...inputProps} /></div>;
}

export function FormSelect({ id, label, value, onChange, options, grouped }) {
  const handleChange = (nextValue) => onChange({ target: { name: id, value: nextValue } });

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label}</label>
      <AnimatedDropdown
        value={value}
        onChange={handleChange}
        options={options}
        grouped={grouped}
        placeholder="Select"
        searchable={grouped}
        usePortal
      />
    </div>
  );
}
