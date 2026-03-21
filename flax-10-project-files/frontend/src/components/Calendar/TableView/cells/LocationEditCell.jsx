import { LocationAutocomplete } from '../../EventModal/components/LocationAutoComplete';
import styles from '../TableView.module.css';


export function LocationEditCell({ value, isEditing, onChange, onSave }) {
    if (!isEditing) {
        return <span className={styles.cellText}>{value || ''}</span>;
    }

    const handleChange = (newValue) => {
        onChange(newValue);
    };

    const handleBlur = () => {
        if (onSave) {
            onSave();
        }
    };

    return (
        <div className={styles.autocompleteCell} onBlur={handleBlur}>
        <LocationAutocomplete
            value={value || ''}
            onChange={handleChange}
            placeholder="Enter location"
        />
        </div>
    );
}