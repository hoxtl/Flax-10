/*
 * LocationEditCell.jsx
 * Editable location cell for the calendar table view.
 */

import { LocationAutocomplete } from "../../event_modal/components/LocationAutoComplete";
import LocationLink from "../../../common/location_link/LocationLink";
import styles from "../TableView.module.css";

function LocationValue({ value }) {
  if (!value) return <span className={styles.cellText}>{value || ""}</span>;
  return (
    <LocationLink
      location={value}
      className={styles.locationLink}
      textClassName={styles.locationLinkText}
      onClick={(event) => event.stopPropagation()}
    />
  );
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
