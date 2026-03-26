/*
 * Shared form controls for settings inputs and selects.
 */
<<<<<<< HEAD

import styles from "../../../pages/settings/Settings.module.css";
import AnimatedDropdown from "../../common/animated_dropdown";
=======
import styles from "../../../pages/Settings/Settings.module.css";
import AnimatedDropdown from "../../common/AnimatedDropdown";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import FormTextInput from "./FormTextInput";

function RemainingCount({ remaining }) {
  return (
<<<<<<< HEAD
    <span className={styles.remainingCount}>
=======
    <span style={{ color: "var(--muted)", fontSize: "0.9em", marginLeft: "5px" }}>
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
