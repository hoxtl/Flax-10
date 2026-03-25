/*
 * LocationEditCell.jsx
 * Editable location cell for the calendar table view.
 */

import { LocationAutocomplete } from "../../EventModal/components/LocationAutoComplete";
import styles from "../TableView.module.css";

function LocationValue({ value }) {
  return <span className={styles.cellText}>{value || ""}</span>;
}

function LocationEditor({ onChange, onSave, value }) {
  return (
    <div className={styles.autocompleteCell} onBlur={onSave}>
      <LocationAutocomplete
        value={value || ""}
        onChange={onChange}
        placeholder="Enter location"
      />
    </div>
  );
}

export function LocationEditCell({ value, isEditing, onChange, onSave }) {
  if (!isEditing) return <LocationValue value={value} />;
  return <LocationEditor value={value} onChange={onChange} onSave={onSave} />;
}
